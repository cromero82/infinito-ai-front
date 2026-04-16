import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { RelationalProductService } from '../../productos/service/relational-product.service';
import { Producto, ProductPage } from '../../productos/model/producto';
import { EditarProductoComponent } from '../../productos/editar-producto/editar-producto.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ModoPrecioLista } from '../service/producto-desde-lista-ventas.service';

export interface SelectorProductosData {
  term: string;
}

/** Resultado del diálogo: producto elegido y modo de precio (venta vs unidad) cuando aplica. */
export interface SelectorProductosResult {
  product: Producto;
  modoPrecio: ModoPrecioLista;
}

@Component({
    selector: 'selector-productos',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatTableModule,
        MatIconModule,
        MatTooltipModule,
        DragDropModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './selector-productos.component.html',
    styleUrls: ['./selector-productos.component.scss']
})
export class SelectorProductosComponent implements OnInit, AfterViewInit, OnDestroy {
  searchCtrl = new FormControl('', { nonNullable: true });
  products: Producto[] = [];
  loading = false;
  loadingMore = false;
  error: string | null = null;
  displayedColumns = ['nombre', 'barcode', 'precio', 'acciones'];
  page = 0;
  size = 20;
  totalPages = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  modoPrecioElegidoPorProducto: Record<number, ModoPrecioLista> = {};
  modoPrecioExplicitoPorProducto: Record<number, boolean> = {};

  constructor(
    private dialogRef: MatDialogRef<SelectorProductosComponent, SelectorProductosResult | undefined>,
    private relationalProductService: RelationalProductService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SelectorProductosData
  ) {}

  ngOnInit(): void {
    if (this.data?.term) {
      this.searchCtrl.setValue(this.data.term);
      this.fetchProducts(this.data.term, true);
    }

    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        const term = value?.trim();
        if (!term) {
          this.products = [];
          this.error = null;
          this.page = 0;
          this.totalPages = 0;
          return;
        }
        this.fetchProducts(term, true);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        const input = this.searchInput.nativeElement;
        input.focus();
        // Move cursor to end instead of selecting all text
        const length = input.value.length;
        input.setSelectionRange(length, length);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectProduct(product: Producto): void {
    const modo = this.getModoPrecioParaSeleccion(product);
    this.dialogRef.close({ product, modoPrecio: modo });
  }

  tienePrecioDual(product: Producto): boolean {
    const u = product.precioUnidad;
    return u !== undefined && u !== null && !Number.isNaN(Number(u));
  }

  seleccionarModoPrecio(product: Producto, modo: ModoPrecioLista, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const id = product.id;
    if (id == null) {
      return;
    }
    this.modoPrecioElegidoPorProducto = { ...this.modoPrecioElegidoPorProducto, [id]: modo };
    this.modoPrecioExplicitoPorProducto = { ...this.modoPrecioExplicitoPorProducto, [id]: true };
    this.cdr.markForCheck();
  }

  getModoPrecioParaSeleccion(product: Producto): ModoPrecioLista {
    const id = product.id;
    if (id == null) {
      return 'precio';
    }
    return this.modoPrecioElegidoPorProducto[id] ?? 'precio';
  }

  close(): void {
    this.dialogRef.close();
  }

  clearSearch(): void {
    this.searchCtrl.setValue('');
    this.products = [];
    this.error = null;
    this.page = 0;
    this.totalPages = 0;
  }

  get canCreateProduct(): boolean {
    return this.searchCtrl.value.trim().length > 0;
  }

  editProduct(product: Producto, event: Event): void {
    event.stopPropagation();
    const editDialogRef = this.dialog.open(EditarProductoComponent, {
      width: '600px',
      data: {
        id: product.id,
        nombre: product.nombre,
        barcode: product.barcode,
        precio: product.precio,
        precioUnidad: product.precioUnidad,
        precioCompra: product.precioCompra,
        foto: product.foto,
        company: (product as any).company
      },
      autoFocus: false
    });

    editDialogRef.afterClosed().subscribe((result) => {
      if (result && result._edit) {
        // Product was updated, refresh the product list
        const currentTerm = this.searchCtrl.value?.trim() || '';
        if (currentTerm) {
          this.fetchProducts(currentTerm, true);
        }
      }
    });
  }

  openNuevoProducto(event?: Event): void {
    if (event) {
      event.stopPropagation();
      (event as KeyboardEvent)?.preventDefault?.();
    }

    const searchTerm = this.searchCtrl.value.trim();
    const createDialogRef = this.dialog.open(EditarProductoComponent, {
      width: '600px',
      data: searchTerm ? { barcode: searchTerm } : null,
      autoFocus: false
    });

    createDialogRef.afterClosed().subscribe((result: Producto | undefined) => {
      if (result) {
        this.dialogRef.close({ product: result, modoPrecio: 'precio' });
        return;
      }

      setTimeout(() => {
        this.searchInput?.nativeElement?.focus();
      }, 0);
    });
  }

  private fetchProducts(term: string, reset: boolean): void {
    if (reset) {
      this.page = 0;
      this.totalPages = 0;
      this.products = [];
      this.loading = true;
      this.loadingMore = false;
    } else {
      if (this.loading || this.loadingMore) {
        return;
      }
      this.loadingMore = true;
    }

    this.error = null;
    const pageToLoad = reset ? 0 : this.page + 1;

    this.relationalProductService.getProducts(term, pageToLoad, this.size).subscribe({
      next: (resp: ProductPage) => {
        const content = resp?.content ?? [];
        this.totalPages = resp?.totalPages ?? 0;
        this.page = pageToLoad;

        if (reset) {
          this.products = content;
        } else {
          this.products = this.products.concat(content);
        }

        if (this.products.length === 0) {
          this.error = 'No se encontraron productos.';
        }
        this.loading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        if (reset) {
          this.products = [];
          this.error = 'Error al cargar productos.';
        }
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (!element) {
      return;
    }

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const remaining = scrollHeight - (scrollTop + clientHeight);

    const isNearBottom = remaining < 80;

    const currentTerm = this.searchCtrl.value?.trim();
    if (
      isNearBottom &&
      !this.loading &&
      !this.loadingMore &&
      currentTerm &&
      (this.totalPages === 0 || this.page + 1 < this.totalPages)
    ) {
      this.fetchProducts(currentTerm, false);
    }
  }
}


