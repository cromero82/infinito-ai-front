import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, startWith } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Producto } from '../model/producto';
import { GrupoEspejoDto } from '../model/grupo-espejo';
import { GrupoEspejoService } from '../service/grupo-espejo.service';

export interface SeleccionarCrearGrupoEspejoDialogData {
  producto: Producto;
}

export interface SeleccionarCrearGrupoEspejoDialogResult {
  grupo: GrupoEspejoDto;
}

@Component({
  selector: 'seleccionar-crear-grupo-espejo',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DragDropModule
  ],
  templateUrl: './seleccionar-crear-grupo-espejo.component.html',
  styleUrls: ['./seleccionar-crear-grupo-espejo.component.scss']
})
export class SeleccionarCrearGrupoEspejoComponent implements OnInit, OnDestroy, AfterViewInit {
  searchCtrl = new FormControl<string>('', { nonNullable: true });
  nuevoGrupoNombreCtrl = new FormControl<string>('', { nonNullable: true });

  @ViewChild('nuevoGrupoNombreInput') nuevoGrupoNombreInput?: ElementRef<HTMLInputElement>;
  @ViewChild('searchGrupoInput') searchGrupoInput?: ElementRef<HTMLInputElement>;

  /** Nombre de producto con el que se inicializa el campo (para reaplicar selección tras cargar grupos). */
  private readonly nombreProductoInicial: string;
  /** true si el usuario escribió en "Nombre del grupo" (no reaplicar selección automática). */
  private nombreGrupoEditadoPorUsuario = false;

  resultados: GrupoEspejoDto[] = [];
  selectedGrupo: GrupoEspejoDto | null = null;

  loadingBusqueda = false;
  loadingAccion = false;

  private searchSub?: Subscription;

  constructor(
    private dialogRef: MatDialogRef<
      SeleccionarCrearGrupoEspejoComponent,
      SeleccionarCrearGrupoEspejoDialogResult | undefined
    >,
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarCrearGrupoEspejoDialogData,
    private grupoEspejoService: GrupoEspejoService,
    private snackBar: MatSnackBar
  ) {
    this.nombreProductoInicial = (this.data?.producto?.nombre ?? '').trim();
  }

  get producto(): Producto {
    return this.data.producto;
  }

  /**
   * Sugiere qué tramo del nombre del producto suele usarse como base del nombre del grupo
   * (p. ej. sin presentación " 2000 ML"). El input muestra el nombre completo y se selecciona
   * ese tramo para que el usuario lo vea como en un editor de texto.
   */
  private static suggestedSelectionRangeForGrupoNombre(fullName: string): {
    start: number;
    end: number;
  } {
    const s = (fullName ?? '').trim();
    if (!s.length) {
      return { start: 0, end: 0 };
    }
    // Sufijos típicos de presentación al final: " 2000 ML", " 2.25", " 500 G"
    const rePack =
      /\s+\d+([.,]\d+)?(\s*[A-Za-zÁÉÍÓÚÑáéíóúñ]{1,6})?\s*$/;
    const mPack = s.match(rePack);
    let end = s.length;
    if (mPack && mPack.index !== undefined && mPack.index >= 3) {
      end = mPack.index;
    } else {
      const mX = s.match(/\s+x\s*\d+([.,]\d+)?\s*$/i);
      if (mX && mX.index !== undefined && mX.index >= 3) {
        end = mX.index;
      }
    }
    if (end < 4) {
      end = Math.min(s.length, Math.max(6, Math.ceil(s.length * 0.65)));
    }
    return { start: 0, end };
  }

  ngOnInit(): void {
    this.nuevoGrupoNombreCtrl.setValue(this.nombreProductoInicial);

    this.searchSub = this.searchCtrl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(350),
        distinctUntilChanged()
      )
      .subscribe((q) => this.buscar(q ?? ''));
  }

  ngAfterViewInit(): void {
    // Tras pintar el input: foco y selección del tramo sugerido (mismo texto que "Producto actual")
    setTimeout(() => this.applySuggestedNombreSelection(), 0);
  }

  /** Solo eventos de teclado/pegar del usuario; no se dispara con setValue programático. */
  onNuevoGrupoNombreUserInput(): void {
    this.nombreGrupoEditadoPorUsuario = true;
  }

  private applySuggestedNombreSelection(): void {
    const el = this.nuevoGrupoNombreInput?.nativeElement;
    if (!el) {
      return;
    }
    const val = this.nuevoGrupoNombreCtrl.value ?? '';
    const { start, end } =
      SeleccionarCrearGrupoEspejoComponent.suggestedSelectionRangeForGrupoNombre(val);
    if (end <= start) {
      return;
    }
    el.focus();
    try {
      el.setSelectionRange(start, end);
    } catch {
      /* ignore */
    }
  }

  /**
   * Tras cargar la lista de grupos el DOM se actualiza y el navegador suele perder la selección
   * del input "Nombre del grupo". Se reaplica si el valor sigue siendo el inicial y el usuario
   * no editó; no se roba el foco si está en el campo de búsqueda.
   */
  private scheduleRestoreNombreSelectionAfterBuscar(): void {
    setTimeout(() => {
      if (this.nombreGrupoEditadoPorUsuario) {
        return;
      }
      const val = (this.nuevoGrupoNombreCtrl.value ?? '').trim();
      if (val !== this.nombreProductoInicial) {
        return;
      }
      const searchEl = this.searchGrupoInput?.nativeElement;
      if (searchEl && document.activeElement === searchEl) {
        return;
      }
      this.applySuggestedNombreSelection();
    }, 0);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  buscar(query: string): void {
    this.loadingBusqueda = true;
    this.grupoEspejoService
      .buscar(query.trim())
      .pipe(
        finalize(() => {
          this.loadingBusqueda = false;
          this.scheduleRestoreNombreSelectionAfterBuscar();
        })
      )
      .subscribe({
        next: (list) => {
          this.resultados = list ?? [];
          if (this.selectedGrupo) {
            const updated = this.resultados.find((g) => g.id === this.selectedGrupo!.id);
            this.selectedGrupo = updated ?? null;
          }
        },
        error: () => {
          this.resultados = [];
          this.snackBar.open('No se pudo cargar la lista de grupos espejo.', 'Cerrar', {
            duration: 5000
          });
        }
      });
  }

  seleccionarGrupo(g: GrupoEspejoDto): void {
    this.selectedGrupo = g;
  }

  trackByGrupoId(_: number, g: GrupoEspejoDto): number {
    return g.id;
  }

  crearNuevoGrupo(): void {
    const nombre = this.nuevoGrupoNombreCtrl.value?.trim();
    const pid = this.producto.id;
    if (!nombre || !pid) {
      this.snackBar.open('Indique un nombre para el nuevo grupo espejo.', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    this.loadingAccion = true;
    this.grupoEspejoService
      .crear({ nombre, productoIds: [pid] })
      .pipe(finalize(() => (this.loadingAccion = false)))
      .subscribe({
        next: (grupo) => {
          this.snackBar.open('Grupo espejo creado correctamente.', 'Cerrar', {
            duration: 4000
          });
          this.dialogRef.close({ grupo });
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(
            this.messageFromError(err, 'No se pudo crear el grupo espejo.'),
            'Cerrar',
            { duration: 6000 }
          );
        }
      });
  }

  agregarAGrupoSeleccionado(): void {
    const g = this.selectedGrupo;
    const pid = this.producto.id;
    if (!g || !pid) {
      this.snackBar.open('Seleccione un grupo espejo de la lista.', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    this.loadingAccion = true;
    this.grupoEspejoService
      .agregarProducto(g.id, pid)
      .pipe(finalize(() => (this.loadingAccion = false)))
      .subscribe({
        next: (grupo) => {
          this.snackBar.open('Producto agregado al grupo espejo.', 'Cerrar', {
            duration: 4000
          });
          this.dialogRef.close({ grupo });
        },
        error: (err: HttpErrorResponse) => {
          let msg = 'No se pudo agregar el producto al grupo.';
          if (err.status === 404) {
            msg =
              'No se encontró el grupo espejo o el producto.';
          } else if (err.status === 409) {
            msg =
              'El producto ya pertenece a otro grupo espejo.';
          } else {
            msg = this.messageFromError(err, msg);
          }
          this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private messageFromError(err: HttpErrorResponse, fallback: string): string {
    const body = err?.error;
    if (body && typeof body === 'object' && 'message' in body) {
      const m = (body as { message?: string }).message;
      if (m && typeof m === 'string') return m;
    }
    if (typeof body === 'string' && body.length > 0) return body;
    return fallback;
  }
}
