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
import { RelationalProductService } from '../../products/service/relational-product.service';
import { Producto, ProductPage } from '../../products/model/producto';
import { Subject, of, throwError, Observable, EMPTY } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, tap, map, finalize } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import {
  ReciboDetalleService,
  ReciboDetalleDto,
  CreateReciboDetalleRequest,
  UpdateReciboDetalleRequest
} from '../service/recibo-detalle.service';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { ReciboService, ReciboDto, ActualizarReciboRequest } from '../service/recibo.service';
import { TicketReciboService, TicketReciboDto } from '../service/ticket-recibo.service';
import {
  ProductListSelectComponent,
  ProductListSelectData
} from '../product-list-select/product-list-select.component';
import {
  PagoEfectivoCambioComponent,
  PagoEfectivoCambioData,
  PagoEfectivoCambioResultado
} from '../pago-efectivo-cambio/pago-efectivo-cambio.component';

const ESTADOS_RECIBO = {
  PENDIENTE_PAGO: 1,
  PAGADO: 2,
  ANULADO: 3
} as const;

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
    MatIconModule,
    MatTooltipModule,
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
  @Output() metodoPagoActualizado = new EventEmitter<void>();

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
  private dialogAbierto = false;
  private destroy$ = new Subject<void>();
  @ViewChild('detalleList') detalleListRef?: ElementRef<HTMLDivElement>;
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  metodosPago: MetodoPagoDto[] = [];
  actualizandoMetodoPago = false;
  constructor(
    private reciboService: ReciboService,
    private reciboDetalleService: ReciboDetalleService,
    private relationalProductService: RelationalProductService,
    private dialog: MatDialog,
    private metodoPagoService: MetodoPagoService,
    private ticketReciboService: TicketReciboService
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
    this.cargarMetodosPago();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dialogAbierto = false;
    this.searchingProduct = false;
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

    // Check if product already exists in detalles
    const existingDetalleIndex = this.detalles.findIndex(
      (det) => det.productoId === product.id
    );

    if (existingDetalleIndex >= 0) {
      // Product exists, increment quantity
      const existingDetalle = this.detalles[existingDetalleIndex];
      const currentCantidad = Number(existingDetalle.cantidad ?? 0);
      const unitPrice =
        existingDetalle.producto?.precio ??
        (currentCantidad > 0 ? Number(existingDetalle.subtotal ?? 0) / currentCantidad : product.precio ?? 0);

      if (!existingDetalle.id || unitPrice <= 0 || !existingDetalle.reciboId || !existingDetalle.productoId) {
        this.productSearchError = 'No se pudo actualizar el producto existente.';
        this.searchingProduct = false;
        this.focusSearchInputRequest.emit();
        return;
      }

      const newCantidad = currentCantidad + 1;
      const newSubtotal = unitPrice * newCantidad;
      const previousDetalle = { ...existingDetalle };

      const payload: UpdateReciboDetalleRequest = {
        reciboId: existingDetalle.reciboId,
        productoId: existingDetalle.productoId,
        cantidad: newCantidad,
        subtotal: newSubtotal
      };

      const optimisticDetalle: ReciboDetalleDto = {
        ...existingDetalle,
        cantidad: newCantidad,
        subtotal: newSubtotal
      };

      const updatedList = [...this.detalles];
      updatedList[existingDetalleIndex] = optimisticDetalle;
      this.detalles = updatedList;
      this.recalculateTotal();
      this.selectedDetalleIndex = existingDetalleIndex;
      this.productSearchCtrl.setValue('');
      this.searchingProduct = false;
      this.productSearchError = null;
      this.focusSearchInputRequest.emit();
      this.scrollDetalleListToBottom();

      this.reciboDetalleService.updateDetalle(existingDetalle.id, payload).subscribe({
        next: (updatedDetalle) => {
          const updatedListFinal = [...this.detalles];
          const detalleActualizado = {
            ...optimisticDetalle,
            ...updatedDetalle,
            cantidad: newCantidad,
            subtotal: newSubtotal,
            producto: updatedDetalle.producto ?? existingDetalle.producto
          };
          updatedListFinal[existingDetalleIndex] = detalleActualizado;
          this.detalles = updatedListFinal;
          this.recalculateTotal();
        },
        error: (err: unknown) => {
          const revertedList = [...this.detalles];
          revertedList[existingDetalleIndex] = previousDetalle;
          this.detalles = revertedList;
          this.recalculateTotal();
          console.error('Error actualizando cantidad del producto', err);
          this.productSearchError = 'No se pudo actualizar la cantidad.';
        }
      });
      return;
    }

    // Product doesn't exist, create new detail
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
    this.dialogAbierto = false;
    this.focusSearchInputRequest.emit();
  }

  private performProductSearch(term: string, triggeredAutomatically: boolean): void {
    if (this.searchingProduct || this.dialogAbierto) {
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
        if (this.dialogAbierto) {
          return;
        }
        this.dialogAbierto = true;
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
          this.dialogAbierto = false;
          this.searchingProduct = false;
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

  private cargarMetodosPago(): void {
    this.metodoPagoService
      .obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) =>
          (this.metodosPago = (metodos ?? []).slice().sort((a, b) => a.id - b.id)),
        error: (err) => console.error('Error cargando métodos de pago', err)
      });
  }

  formatCurrency(value: number | null | undefined): string {
    const numericValue = Number(value ?? 0);
    const formatted = this.currencyFormatter.format(numericValue);
    return formatted.replace('COP', '$').trim();
  }

  seleccionarMetodoPago(metodo: MetodoPagoDto): void {
    if (!metodo || metodo.estado === 'inactivo' || !this.recibo || !this.reciboId || this.actualizandoMetodoPago) {
      return;
    }

    if (this.recibo.metodoPagoId === metodo.id) {
      return;
    }

    const preProceso$: Observable<void> =
      metodo.id === 1
        ? this.dialog
            .open<PagoEfectivoCambioComponent, PagoEfectivoCambioData, PagoEfectivoCambioResultado>(
              PagoEfectivoCambioComponent,
              {
                width: '640px',
                data: {
                  total: Number(this.recibo?.total ?? 0)
                },
                autoFocus: false,
                disableClose: true
              }
            )
            .afterClosed()
            .pipe(
              switchMap((resultado) => {
                if (!resultado) {
                  return EMPTY;
                }
                return of(void 0);
              })
            )
        : of(void 0);

    this.actualizandoMetodoPago = true;

    preProceso$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.obtenerTicketAsociado()),
        switchMap((ticketId) => {
          const payload: ActualizarReciboRequest = {
            clienteId: this.recibo!.clienteId,
            ticketId,
            estadoId: ESTADOS_RECIBO.PAGADO,
            metodoPagoId: metodo.id,
            total: Number(this.recibo!.total ?? 0).toFixed(2)
          };

          return this.reciboService.actualizarRecibo(this.recibo!.id, payload).pipe(
            switchMap(() =>
              this.ticketReciboService.getByTicketId(ticketId).pipe(
                map((relacion) => {
                  if (!relacion?.reciboId) {
                    throw new Error('No se encontró relación recibo para este ticket.');
                  }
                  return relacion.reciboId;
                })
              )
            )
          );
        }),
        switchMap((reciboIdActualizado) =>
          this.reciboService.getRecibo(reciboIdActualizado).pipe(
            tap((reciboActualizado) => {
              this.recibo = {
                ...this.recibo!,
                ...reciboActualizado
              };
              this.fetchDetalles(reciboActualizado.id);
            }),
            map(() => reciboIdActualizado)
          )
        ),
        finalize(() => {
          this.actualizandoMetodoPago = false;
        })
      )
      .subscribe({
        next: () => {
          this.metodoPagoActualizado.emit();
        },
        error: (err: unknown) => {
          console.error('Error actualizando método de pago', err);
        }
      });
  }

  private obtenerTicketAsociado(): Observable<number> {
    if (this.ticket?.id) {
      return of(this.ticket.id);
    }
    if (this.recibo?.ticketId) {
      return of(this.recibo.ticketId);
    }
    if (!this.recibo?.id) {
      return throwError(() => new Error('Recibo no válido para determinar ticket.'));
    }

    return this.ticketReciboService.getByReciboId(this.recibo.id).pipe(
      map((relacion) => {
        if (!relacion?.ticketId) {
          throw new Error('No se encontró un ticket asociado al recibo.');
        }
        return relacion.ticketId;
      })
    );
  }
}

