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
  ElementRef,
  ChangeDetectorRef
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ReciboDetalleService,
  ReciboDetalleDto,
  CreateReciboDetalleRequest,
  UpdateReciboDetalleRequest
} from '../service/recibo-detalle.service';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { ReciboService, ReciboDto, ActualizarReciboRequest } from '../service/recibo.service';
import { TicketReciboService, TicketReciboDto } from '../service/ticket-recibo.service';
import { EstadoRecibosService, EstadoReciboDto } from '../service/estado-recibos.service';
import { TicketsService } from '../service/tickets.service';
import {
  ProductListSelectComponent,
  ProductListSelectData
} from '../product-list-select/product-list-select.component';
import {
  PagoEfectivoCambioComponent,
  PagoEfectivoCambioData,
  PagoEfectivoCambioResultado
} from '../pago-efectivo-cambio/pago-efectivo-cambio.component';
import { EdicionReciboComponent } from '../edicion-recibo/edicion-recibo.component';
import { MetodosPagoComponent } from '../metodos-pago/metodos-pago.component';

const ESTADOS_RECIBO = {
  PENDIENTE_PAGO: 1,
  PAGADO: 2,
  ANULADO: 3,
  SIGLA_EDICION: 'ED'
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
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe,
    EdicionReciboComponent,
    MetodosPagoComponent
  ],
  templateUrl: './recibo.component.html',
  styleUrls: ['./recibo.component.scss']
})
export class ReciboComponent implements OnChanges, OnInit, OnDestroy {
  @Input() ticket: any;
  @Input() reciboId: number | null = null;
  @Input() searchInputElement: HTMLInputElement | null = null;
  @Input() sessionId: number | null = null;
  @Output() focusSearchInputRequest = new EventEmitter<void>();
  @Output() metodoPagoActualizado = new EventEmitter<void>();

  recibo: ReciboDto | null = null;
  detalles: ReciboDetalleDto[] = [];
  selectedDetalleIndex = -1;
  editingDetalleIndex = -1;
  editingUnitarioIndex = -1;
  editingProductoIndex = -1;
  editingCantidadCtrl = new FormControl<string>('', { nonNullable: true });
  editingUnitarioCtrl = new FormControl<string>('', { nonNullable: true });
  editingProductoCtrl = new FormControl<string>('', { nonNullable: true });

  loading = false;
  detallesLoading = false;
  error: string | null = null;
  detallesError: string | null = null;

  productSearchCtrl = new FormControl('', { nonNullable: true });
  productSearchError: string | null = null;
  searchingProduct = false;
  private lastSearchDisabled = false;
  private dialogAbierto = false;
  private destroy$ = new Subject<void>();
  @ViewChild('detalleList') detalleListRef?: ElementRef<HTMLDivElement>;
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  actualizandoMetodoPago = false;
  estadosRecibos: EstadoReciboDto[] = [];
  estaEnEdicion = false;
  metodosPago: MetodoPagoDto[] = [];
  constructor(
    private reciboService: ReciboService,
    private reciboDetalleService: ReciboDetalleService,
    private relationalProductService: RelationalProductService,
    private dialog: MatDialog,
    private metodoPagoService: MetodoPagoService,
    private ticketReciboService: TicketReciboService,
    private snackBar: MatSnackBar,
    private estadoRecibosService: EstadoRecibosService,
    private ticketsService: TicketsService,
    private cdr: ChangeDetectorRef
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
    this.cargarEstadosRecibos();
    this.cargarMetodosPago();
    this.updateSearchDisabled();
  }

  private updateSearchDisabled(): void {
    const disabled = !this.reciboId || this.searchingProduct || this.loading;
    if (disabled !== this.lastSearchDisabled) {
      this.lastSearchDisabled = disabled;
      if (disabled) {
        this.productSearchCtrl.disable({ emitEvent: false });
      } else {
        this.productSearchCtrl.enable({ emitEvent: false });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dialogAbierto = false;
    this.searchingProduct = false;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isTextInput =
      target !== null &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable);
    const isSearchInput = target === this.searchInputElement;

    // Manejar teclas de flecha arriba y abajo
    const isArrowUp = event.key === 'ArrowUp' || event.code === 'ArrowUp';
    const isArrowDown = event.key === 'ArrowDown' || event.code === 'ArrowDown';

    if (isArrowUp || isArrowDown) {
      // Solo procesar si no estamos en un input de texto (excepto el search input)
      if (isTextInput && !isSearchInput) {
        return;
      }

      // Solo procesar si hay detalles disponibles
      if (this.detalles.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (isArrowUp) {
        this.navigateDetalleUp();
        return;
      }

      if (isArrowDown) {
        this.navigateDetalleDown();
        return;
      }
    }

    // Manejar teclas + y - solo si hay un detalle seleccionado
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
      this.updateSearchDisabled();
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
      this.updateSearchDisabled();
      return;
    }

    if (!product.id) {
      this.productSearchError = 'El producto no tiene un identificador válido.';
      this.searchingProduct = false;
      this.updateSearchDisabled();
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
        this.updateSearchDisabled();
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
      this.updateSearchDisabled();
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
        this.updateSearchDisabled();
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
        this.updateSearchDisabled();
        this.focusSearchInputRequest.emit();
      }
    });
  }

  private fetchRecibo(id: number): void {
    this.loading = true;
    this.updateSearchDisabled();
    this.error = null;
    this.reciboService.getRecibo(id).subscribe({
      next: (resp) => {
        this.recibo = {
          ...resp,
          sesionId: this.sessionId ?? resp.sesionId
        };
        this.actualizarEstadoEdicion();
        this.loading = false;
        this.updateSearchDisabled();
        this.fetchDetalles(id);
      },
      error: (err: unknown) => {
        console.error('Error loading recibo', err);
        this.recibo = null;
        this.estaEnEdicion = false;
        this.error = 'No se pudo cargar el recibo.';
        this.loading = false;
        this.updateSearchDisabled();
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
    this.estaEnEdicion = false;
    this.updateSearchDisabled();
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
    this.updateSearchDisabled();
    this.relationalProductService.getProducts(term, 0, 1).subscribe({
      next: (page: ProductPage) => {
        const total = page?.totalElements ?? page?.content?.length ?? 0;
        const products = page?.content ?? [];
        if (total === 1 && products[0]) {
          this.addProductToRecibo(products[0]);
          return;
        }

        this.searchingProduct = false;
        this.updateSearchDisabled();

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
          this.updateSearchDisabled();
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
        this.updateSearchDisabled();
        if (!triggeredAutomatically) {
          this.productSearchError = 'Error al buscar el producto.';
        }
        this.focusSearchInputRequest.emit();
      }
    });
  }

  private recalculateTotal(): number {
    if (!this.recibo) {
      return 0;
    }
    const sum = this.detalles.reduce(
      (acc, det) => acc + Number(det?.subtotal ?? 0),
      0
    );
    this.recibo = {
      ...this.recibo,
      total: sum
    };
    return sum;
  }

  selectDetalle(index: number): void {
    if (index < 0 || index >= this.detalles.length) {
      this.selectedDetalleIndex = -1;
    } else {
      this.selectedDetalleIndex = index;
      this.scrollToSelectedDetalle();
    }
    this.focusSearchInputRequest.emit();
  }

  private navigateDetalleUp(): void {
    if (this.detalles.length === 0) {
      return;
    }

    if (this.selectedDetalleIndex <= 0) {
      // Si estamos en el primer elemento o no hay selección, ir al último
      this.selectedDetalleIndex = this.detalles.length - 1;
    } else {
      // Ir al elemento anterior
      this.selectedDetalleIndex--;
    }

    this.scrollToSelectedDetalle();
  }

  private navigateDetalleDown(): void {
    if (this.detalles.length === 0) {
      return;
    }

    if (this.selectedDetalleIndex < 0 || this.selectedDetalleIndex >= this.detalles.length - 1) {
      // Si estamos en el último elemento o no hay selección, ir al primero
      this.selectedDetalleIndex = 0;
    } else {
      // Ir al elemento siguiente
      this.selectedDetalleIndex++;
    }

    this.scrollToSelectedDetalle();
  }

  private scrollToSelectedDetalle(): void {
    if (this.selectedDetalleIndex < 0 || this.selectedDetalleIndex >= this.detalles.length) {
      return;
    }

    const listEl = this.detalleListRef?.nativeElement;
    if (!listEl) {
      return;
    }

    // Esperar a que Angular actualice el DOM
    setTimeout(() => {
      const selectedRow = listEl.querySelector(`.detalle-row:nth-child(${this.selectedDetalleIndex + 1})`) as HTMLElement;
      if (selectedRow) {
        const rowTop = selectedRow.offsetTop;
        const rowHeight = selectedRow.offsetHeight;
        const listTop = listEl.scrollTop;
        const listHeight = listEl.clientHeight;

        // Si el elemento está fuera de la vista superior
        if (rowTop < listTop) {
          listEl.scrollTop = rowTop;
        }
        // Si el elemento está fuera de la vista inferior
        else if (rowTop + rowHeight > listTop + listHeight) {
          listEl.scrollTop = rowTop + rowHeight - listHeight;
        }
      }
    }, 0);
  }

  onDetalleDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (index < 0 || index >= this.detalles.length) {
      return;
    }
    const target = event.target as HTMLElement;
    const detalle = this.detalles[index];
    
    // Check if double-click was on "Valor unitario" field
    if (target.classList.contains('detalle-col') && target.classList.contains('unitario')) {
      this.onUnitarioDoubleClick(index, event);
      return;
    }
    
    // Check if double-click was on "Producto" field
    if (target.classList.contains('detalle-col') && target.classList.contains('producto')) {
      this.onProductoDoubleClick(index, event);
      return;
    }
    
    // Default: edit cantidad
    this.editingDetalleIndex = index;
    this.editingCantidadCtrl.setValue(String(detalle.cantidad ?? 1));
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector(`.cantidad-input-${index}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  onUnitarioDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (index < 0 || index >= this.detalles.length) {
      return;
    }
    const detalle = this.detalles[index];
    if (!detalle.producto?.id) {
      return;
    }
    
    const currentPrecio = detalle.producto.precio ?? (detalle.cantidad > 0 ? detalle.subtotal / detalle.cantidad : 0);
    this.editingUnitarioIndex = index;
    this.editingUnitarioCtrl.setValue(String(currentPrecio));
    
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector(`.valor-unitario-input-${index}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  onCantidadInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      // Use setTimeout to ensure the form control value is updated
      setTimeout(() => {
        this.saveCantidadEdit(index);
      }, 0);
    } else if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      this.cancelCantidadEdit();
    }
  }

  onCantidadInputBlur(index: number): void {
    // Use setTimeout to allow click events to fire first
    setTimeout(() => {
      if (this.editingDetalleIndex === index) {
        this.saveCantidadEdit(index);
      }
    }, 150);
  }

  saveCantidadEdit(index: number): void {
    if (this.editingDetalleIndex !== index || index < 0 || index >= this.detalles.length) {
      this.cancelCantidadEdit();
      return;
    }

    const detalle = this.detalles[index];
    // Get value directly from the input element if possible, otherwise from form control
    const inputElement = document.querySelector(`.cantidad-input-${index}`) as HTMLInputElement;
    const newCantidadStr = inputElement?.value?.trim() || this.editingCantidadCtrl.value?.trim() || '';
    const newCantidad = Number(newCantidadStr);

    if (isNaN(newCantidad) || newCantidad <= 0) {
      this.cancelCantidadEdit();
      return;
    }

    if (newCantidad === detalle.cantidad) {
      this.cancelCantidadEdit();
      return;
    }

    const unitPrice =
      detalle.producto?.precio ??
      (detalle.cantidad > 0 ? Number(detalle.subtotal ?? 0) / detalle.cantidad : 0);

    if (!detalle.id || unitPrice <= 0 || !detalle.reciboId || !detalle.productoId) {
      this.cancelCantidadEdit();
      return;
    }

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

    // Clear editing state immediately to return to normal display
    this.editingDetalleIndex = -1;
    this.editingCantidadCtrl.setValue('');
    
    const updatedList = [...this.detalles];
    updatedList[index] = optimisticDetalle;
    this.detalles = updatedList;
    const newTotal = this.recalculateTotal();
    this.focusSearchInputRequest.emit();

    this.reciboDetalleService.updateDetalle(detalle.id, payload).subscribe({
      next: (updatedDetalle) => {
        const updatedListFinal = [...this.detalles];
        const detalleActualizado = {
          ...optimisticDetalle,
          ...updatedDetalle,
          cantidad: newCantidad,
          subtotal: newSubtotal,
          producto: updatedDetalle.producto ?? detalle.producto
        };
        updatedListFinal[index] = detalleActualizado;
        this.detalles = updatedListFinal;
        const finalTotal = this.recalculateTotal();
        
        // Update recibo total on backend
        if (this.recibo && this.recibo.id && this.recibo.ticketId && this.recibo.clienteId) {
          this.reciboService.actualizarRecibo(this.recibo.id, {
            clienteId: this.recibo.clienteId,
            ticketId: this.recibo.ticketId,
            estadoId: this.recibo.estadoId ?? ESTADOS_RECIBO.PENDIENTE_PAGO,
            metodoPagoId: this.recibo.metodoPagoId ?? 0,
            total: String(finalTotal.toFixed(2)),
            sesionId: this.recibo.sesionId
          }).subscribe({
            next: (updatedRecibo) => {
              this.recibo = updatedRecibo;
              
              // Emitir evento para que el componente padre recargue los tickets
              this.metodoPagoActualizado.emit();
            },
            error: (err) => {
              console.error('Error updating recibo total', err);
            }
          });
        }
      },
      error: (err: unknown) => {
        const revertedList = [...this.detalles];
        revertedList[index] = previousDetalle;
        this.detalles = revertedList;
        this.recalculateTotal();
        console.error('Error updating detalle quantity', err);
        this.cancelCantidadEdit();
      }
    });
  }

  cancelCantidadEdit(): void {
    this.editingDetalleIndex = -1;
    this.editingCantidadCtrl.setValue('');
  }

  onUnitarioInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      setTimeout(() => {
        this.saveUnitarioEdit(index);
      }, 0);
    } else if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      this.cancelUnitarioEdit();
    }
  }

  onUnitarioInputBlur(index: number): void {
    setTimeout(() => {
      if (this.editingUnitarioIndex === index) {
        this.saveUnitarioEdit(index);
      }
    }, 150);
  }

  saveUnitarioEdit(index: number): void {
    if (this.editingUnitarioIndex !== index || index < 0 || index >= this.detalles.length) {
      this.cancelUnitarioEdit();
      return;
    }

    const detalle = this.detalles[index];
    if (!detalle.producto?.id) {
      this.cancelUnitarioEdit();
      return;
    }

    const inputElement = document.querySelector(`.valor-unitario-input-${index}`) as HTMLInputElement;
    const newPrecioStr = inputElement?.value?.trim() || this.editingUnitarioCtrl.value?.trim() || '';
    const newPrecio = Number(newPrecioStr);

    if (isNaN(newPrecio) || newPrecio <= 0) {
      this.cancelUnitarioEdit();
      return;
    }

    const currentPrecio = detalle.producto.precio ?? (detalle.cantidad > 0 ? detalle.subtotal / detalle.cantidad : 0);
    if (newPrecio === currentPrecio) {
      this.cancelUnitarioEdit();
      return;
    }

    // Clear editing state immediately
    this.editingUnitarioIndex = -1;
    this.editingUnitarioCtrl.setValue('');

    // Update product via RelationalProductService
    const productUpdate: Producto = {
      ...detalle.producto,
      precio: newPrecio,
      foto: detalle.producto.foto ?? ''
    };

    this.relationalProductService.updateProduct(detalle.producto.id, productUpdate).subscribe({
      next: (updatedProduct) => {
        // Find all detalles that use this product
        const detallesToUpdate = this.detalles.filter((det) => det.productoId === updatedProduct.id);
        
        // Optimistically update all detalles
        const updatedList = this.detalles.map((det) => {
          if (det.productoId === updatedProduct.id) {
            const newSubtotal = updatedProduct.precio * det.cantidad;
            return {
              ...det,
              subtotal: newSubtotal,
              producto: {
                ...det.producto!,
                ...updatedProduct,
                precio: updatedProduct.precio
              }
            };
          }
          return det;
        });
        this.detalles = updatedList;
        this.recalculateTotal();
        
        // Update each detalle via API
        detallesToUpdate.forEach((det) => {
          if (!det.id) {
            return;
          }
          const newSubtotal = updatedProduct.precio * det.cantidad;
          const payload: UpdateReciboDetalleRequest = {
            reciboId: det.reciboId,
            productoId: det.productoId,
            cantidad: det.cantidad,
            subtotal: newSubtotal
          };
          
          this.reciboDetalleService.updateDetalle(det.id, payload).subscribe({
            next: (apiUpdatedDetalle: ReciboDetalleDto) => {
              const finalIndex = this.detalles.findIndex((d) => d.id === det.id);
              if (finalIndex >= 0) {
                const finalList = [...this.detalles];
                const newSubtotal = updatedProduct.precio * det.cantidad;
                finalList[finalIndex] = {
                  ...apiUpdatedDetalle,
                  subtotal: newSubtotal,
                  cantidad: det.cantidad,
                  producto: apiUpdatedDetalle.producto
                    ? {
                        ...apiUpdatedDetalle.producto,
                        precio: updatedProduct.precio
                      }
                    : {
                        ...det.producto!,
                        precio: updatedProduct.precio
                      }
                };
                this.detalles = finalList;
                this.recalculateTotal();
              }
            },
            error: (err) => {
              console.error('Error updating detalle after product price change', err);
            }
          });
        });
        
        // Update recibo total on backend
        const finalTotal = this.recalculateTotal();
        if (this.recibo && this.recibo.id && this.recibo.ticketId && this.recibo.clienteId) {
          this.reciboService.actualizarRecibo(this.recibo.id, {
            clienteId: this.recibo.clienteId,
            ticketId: this.recibo.ticketId,
            estadoId: this.recibo.estadoId ?? ESTADOS_RECIBO.PENDIENTE_PAGO,
            metodoPagoId: this.recibo.metodoPagoId ?? 0,
            total: String(finalTotal.toFixed(2)),
            sesionId: this.recibo.sesionId
          }).subscribe({
            next: (updatedRecibo) => {
              this.recibo = updatedRecibo;
              
              // Emitir evento para que el componente padre recargue los tickets
              this.metodoPagoActualizado.emit();
            },
            error: (err) => {
              console.error('Error updating recibo total', err);
            }
          });
        }
        this.focusSearchInputRequest.emit();
      },
      error: (err: unknown) => {
        console.error('Error updating product price', err);
        this.cancelUnitarioEdit();
      }
    });
  }

  cancelUnitarioEdit(): void {
    this.editingUnitarioIndex = -1;
    this.editingUnitarioCtrl.setValue('');
  }

  onProductoDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (index < 0 || index >= this.detalles.length) {
      return;
    }
    const detalle = this.detalles[index];
    if (!detalle.producto?.id || !detalle.producto?.nombre) {
      return;
    }
    
    this.editingProductoIndex = index;
    this.editingProductoCtrl.setValue(detalle.producto.nombre);
    
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector(`.producto-input-${index}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  onProductoInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      setTimeout(() => {
        this.saveProductoEdit(index);
      }, 0);
    } else if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      this.cancelProductoEdit();
    }
  }

  onProductoInputBlur(index: number): void {
    setTimeout(() => {
      if (this.editingProductoIndex === index) {
        this.saveProductoEdit(index);
      }
    }, 150);
  }

  saveProductoEdit(index: number): void {
    if (this.editingProductoIndex !== index || index < 0 || index >= this.detalles.length) {
      this.cancelProductoEdit();
      return;
    }

    const detalle = this.detalles[index];
    if (!detalle.producto?.id) {
      this.cancelProductoEdit();
      return;
    }

    const inputElement = document.querySelector(`.producto-input-${index}`) as HTMLInputElement;
    const newNombre = (inputElement?.value?.trim() || this.editingProductoCtrl.value?.trim() || '').trim();

    if (!newNombre || newNombre.length === 0) {
      this.cancelProductoEdit();
      return;
    }

    if (newNombre === detalle.producto.nombre) {
      this.cancelProductoEdit();
      return;
    }

    // Clear editing state immediately
    this.editingProductoIndex = -1;
    this.editingProductoCtrl.setValue('');

    // Update product via RelationalProductService
    const productUpdate: Producto = {
      ...detalle.producto,
      nombre: newNombre,
      foto: detalle.producto.foto ?? ''
    };

    this.relationalProductService.updateProduct(detalle.producto.id, productUpdate).subscribe({
      next: (updatedProduct) => {
        // Update all detalles that use this product
        const updatedList = this.detalles.map((det) => {
          if (det.productoId === updatedProduct.id) {
            return {
              ...det,
              producto: {
                ...det.producto!,
                ...updatedProduct,
                nombre: updatedProduct.nombre
              }
            };
          }
          return det;
        });
        this.detalles = updatedList;
        this.focusSearchInputRequest.emit();
      },
      error: (err: unknown) => {
        console.error('Error updating product name', err);
        this.cancelProductoEdit();
      }
    });
  }

  cancelProductoEdit(): void {
    this.editingProductoIndex = -1;
    this.editingProductoCtrl.setValue('');
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

  onMetodoPagoSeleccionado(metodo: MetodoPagoDto): void {
    this.seleccionarMetodoPago(metodo);
  }

  onFinalizarEdicion(): void {
    console.log('onFinalizarEdicion called in recibo component');
    console.log('recibo:', this.recibo);
    console.log('metodosPago length:', this.metodosPago.length);
    
    // Si el recibo ya tiene un método de pago seleccionado, usar ese
    if (this.recibo && this.recibo.metodoPagoId) {
      if (this.metodosPago.length > 0) {
        // Buscar el método de pago en la lista
        const metodo = this.metodosPago.find(m => m.id === this.recibo!.metodoPagoId);
        console.log('metodo encontrado:', metodo);
        if (metodo) {
          // Ejecutar el pago usando el método ya seleccionado,
          // omitiendo el diálogo de efectivo si aplica
          this.ejecutarPago(metodo, true);
        } else {
          console.error('No se encontró el método de pago con id:', this.recibo.metodoPagoId);
        }
      } else {
        // Si los métodos de pago aún no se han cargado, esperar un momento
        console.log('Esperando a que se carguen los métodos de pago...');
        setTimeout(() => {
          const metodo = this.metodosPago.find(m => m.id === this.recibo!.metodoPagoId);
          if (metodo) {
            console.log('metodo encontrado después de esperar:', metodo);
            this.ejecutarPago(metodo, true);
          } else {
            console.error('No se encontró el método de pago después de esperar');
          }
        }, 500);
      }
    } else {
      console.warn('El recibo no tiene un método de pago seleccionado. recibo:', this.recibo);
    }
  }

  private ejecutarPago(metodo: MetodoPagoDto, omitirDialogoEfectivo: boolean = false): void {
    console.log('ejecutarPago called with:', { metodo, recibo: this.recibo, reciboId: this.reciboId, actualizandoMetodoPago: this.actualizandoMetodoPago });
    
    if (!metodo || metodo.estado === 'inactivo' || !this.recibo || !this.reciboId || this.actualizandoMetodoPago) {
      console.log('Validación falló en ejecutarPago:', { 
        metodo: !!metodo, 
        metodoEstado: metodo?.estado, 
        recibo: !!this.recibo, 
        reciboId: this.reciboId, 
        actualizandoMetodoPago: this.actualizandoMetodoPago 
      });
      return;
    }

    console.log('Ejecutando pago con método:', metodo);

    const preProceso$: Observable<void> =
      metodo.id === 1 && !omitirDialogoEfectivo
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

    // Capture total before starting the update process
    const totalARegistrar = Number(this.recibo!.total ?? 0);

    preProceso$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.obtenerTicketAsociado()),
        switchMap((ticketId) => {
          const sesionId = this.getSessionId();
          const payload: ActualizarReciboRequest = {
            clienteId: this.recibo!.clienteId,
            ticketId,
            estadoId: ESTADOS_RECIBO.PAGADO,
            metodoPagoId: metodo.id,
            total: totalARegistrar.toFixed(2),
            sesionId: sesionId ?? undefined
          };

          return this.reciboService.actualizarRecibo(this.recibo!.id, payload).pipe(
            switchMap(() => {
              const sessionId = this.getSessionId();
              if (!sessionId) {
                throw new Error('No se encontró sessionId.');
              }
              return this.ticketReciboService.getByTicketId(ticketId, sessionId).pipe(
                map((relacion) => {
                  if (!relacion?.reciboId) {
                    throw new Error('No se encontró relación recibo para este ticket.');
                  }
                  return { reciboId: relacion.reciboId, totalGuardado: totalARegistrar };
                })
              );
            })
          );
        }),
        switchMap(({ reciboId, totalGuardado }) =>
          this.reciboService.getRecibo(reciboId).pipe(
            tap((reciboActualizado) => {
              this.recibo = {
                ...this.recibo!,
                ...reciboActualizado,
                sesionId: this.sessionId ?? reciboActualizado.sesionId
              };
              this.fetchDetalles(reciboActualizado.id);
            }),
            switchMap(() => {
              // Recargar tickets después de actualizar el recibo
              const sessionId = this.getSessionId();
              if (sessionId) {
                return this.ticketsService.getTicketsBySession(sessionId).pipe(
                  takeUntil(this.destroy$),
                  map(() => totalGuardado),
                  tap({
                    error: (err) => {
                      console.error('Error recargando tickets después de actualizar recibo', err);
                    }
                  })
                );
              }
              return of(totalGuardado);
            })
          )
        ),
        finalize(() => {
          this.actualizandoMetodoPago = false;
        })
      )
      .subscribe({
        next: (totalGuardado) => {
          const totalFormateado = this.formatCurrency(totalGuardado);
          const snackBarRef = this.snackBar.open(
            `Recibo por valor de ${totalFormateado} guardado correctamente`,
            undefined,
            {
              duration: 5000,
              horizontalPosition: 'right',
              panelClass: ['recibo-snackbar-success']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector('.recibo-snackbar-success .mat-mdc-snack-bar-label');
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(currencyRegex, `<strong>${match[0]}</strong>`);
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);
          this.metodoPagoActualizado.emit();
        },
        error: (err: unknown) => {
          console.error('Error actualizando método de pago', err);
          const totalFormateado = this.formatCurrency(totalARegistrar);
          const snackBarRef = this.snackBar.open(
            `No fue posible registrar el recibo - total: ${totalFormateado}`,
            undefined,
            {
              duration: 7000,
              horizontalPosition: 'right',
              panelClass: ['recibo-snackbar-error']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector('.recibo-snackbar-error .mat-mdc-snack-bar-label');
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(currencyRegex, `<strong>${match[0]}</strong>`);
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);
        }
      });
  }

  onMetodoPagoSeleccionadoDesdeEdicion(event: { metodo: MetodoPagoDto; valorReferencia: number | null }): void {
    // Cuando se selecciona un método de pago desde el componente de edición,
    // usar valorReferencia (diferencia) para el diálogo, pero procesar el total completo
    const metodo = event.metodo;
    const valorReferencia = event.valorReferencia;

    if (!metodo || metodo.estado === 'inactivo' || !this.recibo || !this.reciboId || this.actualizandoMetodoPago) {
      return;
    }

    // Obtener el total del recibo completo para el PUT
    const totalARegistrar = Number(this.recibo!.total ?? 0);
    // Usar valorReferencia (diferencia) para el diálogo de pago en efectivo
    const valorParaDialogo = valorReferencia !== null && valorReferencia > 0 ? valorReferencia : totalARegistrar;

    const preProceso$: Observable<void> =
      metodo.id === 1
        ? this.dialog
            .open<PagoEfectivoCambioComponent, PagoEfectivoCambioData, PagoEfectivoCambioResultado>(
              PagoEfectivoCambioComponent,
              {
                width: '640px',
                data: {
                  // Usar la diferencia (valorReferencia) para el diálogo
                  total: valorParaDialogo
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
          const sesionId = this.getSessionId();
          const payload: ActualizarReciboRequest = {
            clienteId: this.recibo!.clienteId,
            ticketId,
            estadoId: ESTADOS_RECIBO.PAGADO,
            metodoPagoId: metodo.id,
            total: totalARegistrar.toFixed(2),
            sesionId: sesionId ?? undefined
          };

          return this.reciboService.actualizarRecibo(this.recibo!.id, payload).pipe(
            switchMap(() => {
              const sessionId = this.getSessionId();
              if (!sessionId) {
                throw new Error('No se encontró sessionId.');
              }
              return this.ticketReciboService.getByTicketId(ticketId, sessionId).pipe(
                map((relacion) => {
                  if (!relacion?.reciboId) {
                    throw new Error('No se encontró relación recibo para este ticket.');
                  }
                  return { reciboId: relacion.reciboId, totalGuardado: totalARegistrar };
                })
              );
            })
          );
        }),
        switchMap(({ reciboId, totalGuardado }) =>
          this.reciboService.getRecibo(reciboId).pipe(
            tap((reciboActualizado) => {
              this.recibo = {
                ...this.recibo!,
                ...reciboActualizado,
                sesionId: this.sessionId ?? reciboActualizado.sesionId
              };
              this.fetchDetalles(reciboActualizado.id);
            }),
            switchMap(() => {
              // Recargar tickets después de actualizar el recibo
              const sessionId = this.getSessionId();
              if (sessionId) {
                return this.ticketsService.getTicketsBySession(sessionId).pipe(
                  takeUntil(this.destroy$),
                  map(() => totalGuardado),
                  tap({
                    error: (err) => {
                      console.error('Error recargando tickets después de actualizar recibo', err);
                    }
                  })
                );
              }
              return of(totalGuardado);
            })
          )
        ),
        finalize(() => {
          this.actualizandoMetodoPago = false;
        })
      )
      .subscribe({
        next: (totalGuardado) => {
          const totalFormateado = this.formatCurrency(totalGuardado);
          const snackBarRef = this.snackBar.open(
            `Recibo por valor de ${totalFormateado} guardado correctamente`,
            undefined,
            {
              duration: 5000,
              horizontalPosition: 'right',
              panelClass: ['recibo-snackbar-success']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector('.recibo-snackbar-success .mat-mdc-snack-bar-label');
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(currencyRegex, `<strong>${match[0]}</strong>`);
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);
          this.metodoPagoActualizado.emit();
        },
        error: (err: unknown) => {
          console.error('Error actualizando método de pago', err);
          const totalFormateado = this.formatCurrency(totalARegistrar);
          const snackBarRef = this.snackBar.open(
            `No fue posible registrar el recibo - total: ${totalFormateado}`,
            undefined,
            {
              duration: 7000,
              horizontalPosition: 'right',
              panelClass: ['recibo-snackbar-error']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector('.recibo-snackbar-error .mat-mdc-snack-bar-label');
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(currencyRegex, `<strong>${match[0]}</strong>`);
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);
        }
      });
  }

  private cargarEstadosRecibos(): void {
    this.estadoRecibosService
      .getEstadosRecibos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estados) => {
          this.estadosRecibos = estados ?? [];
          // Si ya hay un recibo cargado, actualizar el estado de edición
          if (this.recibo) {
            this.actualizarEstadoEdicion();
          }
        },
        error: (err) => console.error('Error cargando estados de recibo', err)
      });
  }

  private actualizarEstadoEdicion(): void {
    if (!this.recibo || this.estadosRecibos.length === 0) {
      this.estaEnEdicion = false;
      return;
    }

    // Buscar el estado con sigla "ED"
    const estadoEdicion = this.estadosRecibos.find(
      (e) => e.sigla === ESTADOS_RECIBO.SIGLA_EDICION
    );

    if (!estadoEdicion) {
      this.estaEnEdicion = false;
      return;
    }

    // Verificar si el recibo está en estado de edición
    this.estaEnEdicion = this.recibo.estadoId === estadoEdicion.id;
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

    // Capture total before starting the update process
    const totalARegistrar = Number(this.recibo!.total ?? 0);

    preProceso$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.obtenerTicketAsociado()),
        switchMap((ticketId) => {
          const sesionId = this.getSessionId();
          const payload: ActualizarReciboRequest = {
            clienteId: this.recibo!.clienteId,
            ticketId,
            estadoId: ESTADOS_RECIBO.PAGADO,
            metodoPagoId: metodo.id,
            total: totalARegistrar.toFixed(2),
            sesionId: sesionId ?? undefined
          };

          return this.reciboService.actualizarRecibo(this.recibo!.id, payload).pipe(
            switchMap(() => {
              const sessionId = this.getSessionId();
              if (!sessionId) {
                throw new Error('No se encontró sessionId.');
              }
              return this.ticketReciboService.getByTicketId(ticketId, sessionId).pipe(
                map((relacion) => {
                  if (!relacion?.reciboId) {
                    throw new Error('No se encontró relación recibo para este ticket.');
                  }
                  return { reciboId: relacion.reciboId, totalGuardado: totalARegistrar };
                })
              );
            })
          );
        }),
        switchMap(({ reciboId, totalGuardado }) =>
          this.reciboService.getRecibo(reciboId).pipe(
            tap((reciboActualizado) => {
              this.recibo = {
                ...this.recibo!,
                ...reciboActualizado,
                sesionId: this.sessionId ?? reciboActualizado.sesionId
              };
              this.fetchDetalles(reciboActualizado.id);
            }),
            switchMap(() => {
              // Recargar tickets después de actualizar el recibo
              const sessionId = this.getSessionId();
              if (sessionId) {
                return this.ticketsService.getTicketsBySession(sessionId).pipe(
                  takeUntil(this.destroy$),
                  map(() => totalGuardado),
                  tap({
                    error: (err) => {
                      console.error('Error recargando tickets después de actualizar recibo', err);
                    }
                  })
                );
              }
              return of(totalGuardado);
            })
          )
        ),
        finalize(() => {
          this.actualizandoMetodoPago = false;
        })
      )
      .subscribe({
        next: (totalGuardado) => {
          const totalFormateado = this.formatCurrency(totalGuardado);
          const snackBarRef = this.snackBar.open(
            `Recibo por valor de ${totalFormateado} guardado correctamente`,
            undefined,
            {
              duration: 5000,
              horizontalPosition: 'right',
              panelClass: ['recibo-snackbar-success']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector('.recibo-snackbar-success .mat-mdc-snack-bar-label');
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(currencyRegex, `<strong>${match[0]}</strong>`);
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);
          this.metodoPagoActualizado.emit();
        },
        error: (err: unknown) => {
          console.error('Error actualizando método de pago', err);
          const totalFormateado = this.formatCurrency(totalARegistrar);
          const snackBarRef = this.snackBar.open(
            `No fue posible registrar el recibo - total: ${totalFormateado}`,
            undefined,
            {
              duration: 7000,
              horizontalPosition: 'right',
              panelClass: ['recibo-snackbar-error']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector('.recibo-snackbar-error .mat-mdc-snack-bar-label');
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(currencyRegex, `<strong>${match[0]}</strong>`);
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);
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

  private getSessionId(): number | null {
    // First try to use the input sessionId
    if (this.sessionId !== null && this.sessionId !== undefined) {
      return this.sessionId;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('session-id');
    const parsed = stored ? Number(stored) : NaN;
    if (!parsed || Number.isNaN(parsed)) {
      return null;
    }
    return parsed;
  }

}

