import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil
} from 'rxjs/operators';

import { AuthService } from '../../../../auth/service/auth.service';
import { BarcodeScannerDialogComponent } from '../../productos/barcode-scanner-dialog/barcode-scanner-dialog.component';
import { ProductsService } from '../../productos/service/products-service';
import { Producto } from '../../productos/model/producto';

interface ItemCotizacion {
  producto: Producto;
  cantidad: number;
}

const MIN_SEARCH_LENGTH = 2;

@Component({
  selector: 'gm-micotizacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './micotizacion.component.html',
  styleUrl: './micotizacion.component.scss'
})
export class MiCotizacionComponent implements OnInit, OnDestroy {
  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });

  /** Estado de la sesión de invitado */
  iniciandoSesion = true;
  sesionError = false;

  /** Búsqueda de productos */
  buscando = false;
  busquedaRealizada = false;
  resultados: Producto[] = [];

  /** Carrito (clave: barcode del producto) */
  private readonly carrito = new Map<string, ItemCotizacion>();

  /** Panel del carrito abierto en móvil */
  carritoAbierto = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly productsService: ProductsService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.iniciarSesionInvitado();

    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((termino) => this.buscarProductos(termino));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ───────────────────────── Sesión de invitado ─────────────────────────

  iniciarSesionInvitado(): void {
    this.iniciandoSesion = true;
    this.sesionError = false;
    this.cd.markForCheck();

    this.authService
      .loginGuest()
      .pipe(
        finalize(() => {
          this.iniciandoSesion = false;
          this.cd.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.sesionError = false;
        },
        error: () => {
          this.sesionError = true;
        }
      });
  }

  finalizarCotizacion(): void {
    this.authService
      .cerrarSesionServidor()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.authService.logout();
        this.carrito.clear();
        this.resultados = [];
        this.busquedaRealizada = false;
        this.carritoAbierto = false;
        this.searchCtrl.setValue('', { emitEvent: false });
        this.snackBar.open('Cotización finalizada. ¡Gracias!', 'Cerrar', {
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.iniciarSesionInvitado();
      });
  }

  // ───────────────────────── Búsqueda / escáner ─────────────────────────

  abrirEscaner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'barcode-scanner-dialog-panel'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((codigo: string | undefined) => {
        const trimmed = codigo?.trim();
        if (trimmed) {
          this.searchCtrl.setValue(trimmed);
        }
      });
  }

  buscarProductos(termino: string): void {
    const query = (termino ?? '').trim();

    if (query.length < MIN_SEARCH_LENGTH) {
      this.resultados = [];
      this.busquedaRealizada = false;
      this.buscando = false;
      this.cd.markForCheck();
      return;
    }

    this.buscando = true;
    this.cd.markForCheck();

    this.productsService
      .obtenerProductos(query, 0, 20)
      .pipe(
        finalize(() => {
          this.buscando = false;
          this.busquedaRealizada = true;
          this.cd.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (page) => {
          this.resultados = page?.content ?? [];
        },
        error: () => {
          this.resultados = [];
        }
      });
  }

  limpiarBusqueda(): void {
    this.searchCtrl.setValue('');
    this.resultados = [];
    this.busquedaRealizada = false;
    this.cd.markForCheck();
  }

  // ───────────────────────── Carrito ─────────────────────────

  private claveProducto(producto: Producto): string {
    return producto.barcode || String(producto.id ?? producto.nombre);
  }

  estaEnCarrito(producto: Producto): boolean {
    return this.carrito.has(this.claveProducto(producto));
  }

  cantidadEnCarrito(producto: Producto): number {
    return this.carrito.get(this.claveProducto(producto))?.cantidad ?? 0;
  }

  agregarAlCarrito(producto: Producto): void {
    const clave = this.claveProducto(producto);
    const existente = this.carrito.get(clave);
    if (existente) {
      existente.cantidad += 1;
    } else {
      this.carrito.set(clave, { producto, cantidad: 1 });
    }
    this.snackBar.open(`${producto.nombre} agregado`, '', {
      duration: 1400,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
    this.cd.markForCheck();
  }

  incrementar(producto: Producto): void {
    const item = this.carrito.get(this.claveProducto(producto));
    if (item) {
      item.cantidad += 1;
      this.cd.markForCheck();
    }
  }

  decrementar(producto: Producto): void {
    const clave = this.claveProducto(producto);
    const item = this.carrito.get(clave);
    if (!item) {
      return;
    }
    item.cantidad -= 1;
    if (item.cantidad <= 0) {
      this.carrito.delete(clave);
    }
    this.cd.markForCheck();
  }

  quitarDelCarrito(producto: Producto): void {
    this.carrito.delete(this.claveProducto(producto));
    this.cd.markForCheck();
  }

  vaciarCarrito(): void {
    this.carrito.clear();
    this.carritoAbierto = false;
    this.cd.markForCheck();
  }

  toggleCarrito(): void {
    if (this.totalItems === 0) {
      return;
    }
    this.carritoAbierto = !this.carritoAbierto;
    this.cd.markForCheck();
  }

  cerrarCarrito(): void {
    this.carritoAbierto = false;
    this.cd.markForCheck();
  }

  get items(): ItemCotizacion[] {
    return Array.from(this.carrito.values());
  }

  get totalItems(): number {
    let total = 0;
    this.carrito.forEach((item) => (total += item.cantidad));
    return total;
  }

  get totalCotizacion(): number {
    let total = 0;
    this.carrito.forEach(
      (item) => (total += (item.producto.precio ?? 0) * item.cantidad)
    );
    return total;
  }

  trackByProducto(_index: number, producto: Producto): string {
    return this.claveProducto(producto);
  }

  trackByItem(_index: number, item: ItemCotizacion): string {
    return this.claveProducto(item.producto);
  }
}
