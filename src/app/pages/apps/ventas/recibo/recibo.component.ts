import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
  HostListener,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReciboService, ReciboDto } from '../service/recibo.service';
import {
  ReciboDetalleService,
  ReciboDetalleDto,
  CreateReciboDetalleRequest,
  UpdateReciboDetalleRequest
} from '../service/recibo-detalle.service';
import { RelationalProductService } from '../../products/service/relational-product.service';
import { Producto, ProductPage } from '../../products/model/producto';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  ProductListSelectComponent,
  ProductListSelectData
} from '../product-list-select/product-list-select.component';

@Component({
  selector: 'vex-recibo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './recibo.component.html',
  styleUrls: ['./recibo.component.scss']
})
export class ReciboComponent implements OnChanges, OnInit, OnDestroy {
  @Input() ticket: any;
  @Input() reciboId: number | null = null;
  @Input() searchInputElement: HTMLInputElement | null = null;
  @Output() focusSearchInputRequest = new EventEmitter<void>();

  recibo: ReciboDto | null = null;
  detalles: ReciboDetalleDto[] = [];
  selectedDetalleIndex = -1;

  loading = false;
  detallesLoading = false;
  error: string | null = null;
  detallesError: string | null = null;

  productSearchCtrl = new FormControl('', { nonNullable: true });
  productSearchError: string | null = null;
  searchingProduct = false;
  private destroy$ = new Subject<void>();
  @ViewChild('detalleList') detalleListRef?: ElementRef<HTMLDivElement>;
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  constructor(
    private reciboService: ReciboService,
    private reciboDetalleService: ReciboDetalleService,
    private relationalProductService: RelationalProductService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.productSearchCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        const term = value?.trim();
        if (!term) {
          this.productSearchError = null;
          return;
        }
        this.performProductSearch(term, true);
      });
    this.focusSearchInputRequest.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (this.selectedDetalleIndex < 0) {
      return;
    }

    const isMinusKey =
      event.key === '-' ||
      event.key === 'Minus' ||
      event.code === 'Minus' ||
      event.code === 'NumpadSubtract';

    const isPlusKey =
      event.key === '+' ||
      event.key === 'Add' ||
      event.code === 'NumpadAdd' ||
      (event.code === 'Equal' && event.shiftKey);

    if (!isMinusKey && !isPlusKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const isTextInput =
      target !== null &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable);
    const isSearchInput = target === this.searchInputElement;

    if (isTextInput && !isSearchInput) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (isMinusKey) {
      this.decrementSelectedDetalleQuantity();
      return;
    }

    if (isPlusKey) {
      this.incrementSelectedDetalleQuantity();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('reciboId' in changes) {
      const change = changes['reciboId'];
      const value = change.currentValue as number | null;
      const previous = change.previousValue as number | null;
      if (value === previous) {
        return;
      }
      if (value === null || value === undefined) {
        this.resetState();
      } else {
        this.fetchRecibo(value);
      }
    }
  }

  searchAndAddProduct(): void {
    const searchValue = this.productSearchCtrl.value?.trim();
    if (!this.reciboId) {
      this.productSearchError = 'Seleccione un ticket válido.';
      return;
    }
    if (!searchValue) {
      this.productSearchError = 'Ingrese un código o nombre de producto.';
      return;
    }

    this.performProductSearch(searchValue, false);
  }

  private addProductToRecibo(product: Producto): void {
    if (!this.reciboId) {
      this.productSearchError = 'No hay un recibo seleccionado.';
      this.searchingProduct = false;
      return;
    }

    if (!product.id) {
      this.productSearchError = 'El producto no tiene un identificador válido.';
      this.searchingProduct = false;
      return;
    }

    const cantidad = 1;
    const subtotal = (product.precio ?? 0) * cantidad;
    const payload: CreateReciboDetalleRequest = {
      reciboId: this.reciboId,
      productoId: product.id,
      cantidad,
      subtotal
    };

    this.reciboDetalleService.createDetalle(payload).subscribe({
      next: (detalle) => {
        this.productSearchCtrl.setValue('');
        this.searchingProduct = false;
        this.productSearchError = null;
        const detalleConProducto: ReciboDetalleDto = detalle.producto
          ? detalle
          : {
              ...detalle,
              producto: detalle.producto ?? {
                id: product.id!,
                barcode: product.barcode,
                nombre: product.nombre,
                precio: product.precio,
                precioCompra: product.precioCompra ?? 0,
                foto: product.foto ?? null,
                activate: (product as any).activate ?? 1
              }
            };
        this.detalles = [...this.detalles, detalleConProducto];
        this.recalculateTotal();
        this.selectedDetalleIndex = this.detalles.length - 1;
        this.focusSearchInputRequest.emit();
        this.scrollDetalleListToBottom();
      },
      error: (err: unknown) => {
        console.error('Error agregando producto al recibo', err);
        this.productSearchError = 'No se pudo agregar el producto.';
        this.searchingProduct = false;
        this.focusSearchInputRequest.emit();
      }
    });
  }

  private fetchRecibo(id: number): void {
    this.loading = true;
    this.error = null;
    this.reciboService.getRecibo(id).subscribe({
      next: (resp) => {
        this.recibo = resp;
        this.loading = false;
        this.fetchDetalles(id);
      },
      error: (err: unknown) => {
        console.error('Error loading recibo', err);
        this.recibo = null;
        this.error = 'No se pudo cargar el recibo.';
        this.loading = false;
        this.detalles = [];
        this.detallesError = null;
        this.detallesLoading = false;
      }
    });
  }

  private fetchDetalles(reciboId: number): void {
    this.detallesLoading = true;
    this.detallesError = null;
    this.reciboDetalleService.getDetallesByRecibo(reciboId).subscribe({
      next: (detalles) => {
        this.detalles = detalles || [];
        this.detallesLoading = false;
        this.recalculateTotal();
        this.selectedDetalleIndex = this.detalles.length ? 0 : -1;
      },
      error: (err: unknown) => {
        console.error('Error loading recibo detalles', err);
        this.detalles = [];
        this.detallesError = 'No se pudieron cargar los detalles del recibo.';
        this.detallesLoading = false;
        this.recalculateTotal();
        this.selectedDetalleIndex = -1;
      }
    });
  }

  private resetState(): void {
    this.recibo = null;
    this.detalles = [];
    this.error = null;
    this.detallesError = null;
    this.loading = false;
    this.detallesLoading = false;
    this.productSearchCtrl.setValue('');
    this.productSearchError = null;
    this.searchingProduct = false;
    this.focusSearchInputRequest.emit();
  }

  private performProductSearch(term: string, triggeredAutomatically: boolean): void {
    if (this.searchingProduct) {
      return;
    }
    if (!this.reciboId) {
      this.productSearchError = 'Seleccione un ticket válido.';
      return;
    }

    this.productSearchError = null;
    this.searchingProduct = true;
    this.relationalProductService.getProducts(term, 0, 1).subscribe({
      next: (page: ProductPage) => {
        const total = page?.totalElements ?? page?.content?.length ?? 0;
        const products = page?.content ?? [];
        if (total === 1 && products[0]) {
          this.addProductToRecibo(products[0]);
          return;
        }

        this.searchingProduct = false;

        if (total === 0) {
          if (!triggeredAutomatically) {
            this.productSearchError = 'Producto no encontrado.';
          }
          this.focusSearchInputRequest.emit();
          return;
        }

        // total > 1
        const dialogRef = this.dialog.open<
          ProductListSelectComponent,
          ProductListSelectData,
          Producto
        >(ProductListSelectComponent, {
          width: '800px',
          data: { term },
          autoFocus: false
        });

        dialogRef.afterClosed().subscribe((selected) => {
          if (selected) {
            this.addProductToRecibo(selected);
          } else {
            this.focusSearchInputRequest.emit();
          }
        });
      },
      error: (err: unknown) => {
        console.error('Error searching product', err);
        this.searchingProduct = false;
        if (!triggeredAutomatically) {
          this.productSearchError = 'Error al buscar el producto.';
        }
        this.focusSearchInputRequest.emit();
      }
    });
  }

  private recalculateTotal(): void {
    if (!this.recibo) {
      return;
    }
    const sum = this.detalles.reduce(
      (acc, det) => acc + Number(det?.subtotal ?? 0),
      0
    );
    this.recibo = {
      ...this.recibo,
      total: sum
    };
  }

  selectDetalle(index: number): void {
    if (index < 0 || index >= this.detalles.length) {
      this.selectedDetalleIndex = -1;
    } else {
      this.selectedDetalleIndex = index;
    }
    this.focusSearchInputRequest.emit();
  }

  deleteSelectedDetalle(): void {
    if (this.selectedDetalleIndex < 0 || this.selectedDetalleIndex >= this.detalles.length) {
      return;
    }
    const detalle = this.detalles[this.selectedDetalleIndex];
    this.reciboDetalleService.deleteDetalle(detalle.id).subscribe({
      next: () => {
        const updated = [...this.detalles];
        updated.splice(this.selectedDetalleIndex, 1);
        this.detalles = updated;
        this.recalculateTotal();
        this.selectedDetalleIndex =
          this.detalles.length === 0
            ? -1
            : Math.min(this.selectedDetalleIndex, this.detalles.length - 1);
        this.focusSearchInputRequest.emit();
      },
      error: (err: unknown) => {
        console.error('Error deleting detalle', err);
      }
    });
  }

  private incrementSelectedDetalleQuantity(): void {
    if (this.selectedDetalleIndex < 0 || this.selectedDetalleIndex >= this.detalles.length) {
      return;
    }

    const detalle = this.detalles[this.selectedDetalleIndex];
    const currentCantidad = Number(detalle.cantidad ?? 0);
    const unitPrice =
      detalle.producto?.precio ??
      (currentCantidad > 0 ? Number(detalle.subtotal ?? 0) / currentCantidad : 0);

    if (!detalle.id || unitPrice <= 0 || !detalle.reciboId || !detalle.productoId) {
      return;
    }

    const newCantidad = currentCantidad + 1;
    const newSubtotal = unitPrice * newCantidad;
    const previousDetalle = { ...detalle };

    const payload: UpdateReciboDetalleRequest = {
      reciboId: detalle.reciboId,
      productoId: detalle.productoId,
      cantidad: newCantidad,
      subtotal: newSubtotal
    };

    const optimisticDetalle: ReciboDetalleDto = {
      ...detalle,
      cantidad: newCantidad,
      subtotal: newSubtotal
    };

    const updatedList = [...this.detalles];
    updatedList[this.selectedDetalleIndex] = optimisticDetalle;
    this.detalles = updatedList;
    this.recalculateTotal();

    // Keep focus on search input
        this.focusSearchInputRequest.emit();

    this.reciboDetalleService.updateDetalle(detalle.id, payload).subscribe({
      next: (updatedDetalle) => {
        const updatedListFinal = [...this.detalles];
        const detalleActualizado = {
          ...optimisticDetalle,
          ...updatedDetalle,
          cantidad: newCantidad,
          subtotal: newSubtotal
        };
        updatedListFinal[this.selectedDetalleIndex] = detalleActualizado;
        this.detalles = updatedListFinal;
        this.recalculateTotal();
      },
      error: (err: unknown) => {
        const revertedList = [...this.detalles];
        revertedList[this.selectedDetalleIndex] = previousDetalle;
        this.detalles = revertedList;
        this.recalculateTotal();
        console.error('Error updating detalle quantity', err);
      }
    });
  }

  private decrementSelectedDetalleQuantity(): void {
    if (this.selectedDetalleIndex < 0 || this.selectedDetalleIndex >= this.detalles.length) {
      return;
    }

    const detalle = this.detalles[this.selectedDetalleIndex];
    const currentCantidad = Number(detalle.cantidad ?? 0);
    if (currentCantidad <= 1) {
      this.deleteSelectedDetalle();
      return;
    }

    const unitPrice =
      detalle.producto?.precio ??
      (currentCantidad > 0 ? Number(detalle.subtotal ?? 0) / currentCantidad : 0);

    if (!detalle.id || unitPrice <= 0 || !detalle.reciboId || !detalle.productoId) {
      return;
    }

    const newCantidad = currentCantidad - 1;
    const newSubtotal = unitPrice * newCantidad;
    const previousDetalle = { ...detalle };

    const payload: UpdateReciboDetalleRequest = {
      reciboId: detalle.reciboId,
      productoId: detalle.productoId,
      cantidad: newCantidad,
      subtotal: newSubtotal
    };

    const optimisticDetalle: ReciboDetalleDto = {
      ...detalle,
      cantidad: newCantidad,
      subtotal: newSubtotal
    };

    const updatedList = [...this.detalles];
    updatedList[this.selectedDetalleIndex] = optimisticDetalle;
    this.detalles = updatedList;
    this.recalculateTotal();
    this.focusSearchInputRequest.emit();

    this.reciboDetalleService.updateDetalle(detalle.id, payload).subscribe({
      next: () => {
        const updatedListFinal = [...this.detalles];
        updatedListFinal[this.selectedDetalleIndex] = {
          ...optimisticDetalle,
          cantidad: newCantidad,
          subtotal: newSubtotal
        };
        this.detalles = updatedListFinal;
        this.recalculateTotal();
      },
      error: (err: unknown) => {
        const revertedList = [...this.detalles];
        revertedList[this.selectedDetalleIndex] = previousDetalle;
        this.detalles = revertedList;
        this.recalculateTotal();
        console.error('Error updating detalle quantity', err);
      }
    });
  }

  private scrollDetalleListToBottom(): void {
    const listEl = this.detalleListRef?.nativeElement;
    if (!listEl) {
      return;
    }
    requestAnimationFrame(() => {
      listEl.scrollTop = listEl.scrollHeight;
    });
  }

  formatCurrency(value: number | null | undefined): string {
    const numericValue = Number(value ?? 0);
    const formatted = this.currencyFormatter.format(numericValue);
    return formatted.replace('COP', '$').trim();
  }
}

