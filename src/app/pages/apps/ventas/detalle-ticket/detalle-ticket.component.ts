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
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RelationalProductService } from '../../productos/service/relational-product.service';
import { Producto, ProductPage } from '../../productos/model/producto';
import {
  Subject,
  of,
  throwError,
  Observable,
  EMPTY,
  firstValueFrom
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  switchMap,
  tap,
  map,
  finalize
} from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ReciboDetalleService,
  ReciboDetalleDto,
  ReciboDetalleHistoricoAccionDto,
  CreateReciboDetalleRequest,
  UpdateReciboDetalleRequest
} from '../service/recibo-detalle.service';
import {
  ProductoPresentacionService,
  ProductoPresentacionDto
} from '../service/producto-presentacion.service';
import {
  MetodoPagoService,
  MetodoPagoDto
} from '../service/metodo-pago.service';
import {
  ReciboService,
  ReciboDto,
  ActualizarReciboRequest,
  ActualizarReciboResponse,
  ReciboPagoLinea,
  isReciboPagoResponse
} from '../service/recibo.service';
import {
  TicketReciboService,
  TicketReciboDto
} from '../service/ticket-recibo.service';
import {
  EstadoRecibosService,
  EstadoReciboDto
} from '../service/estado-recibos.service';
import { FechaUtilService } from '../service/fecha-util.service';
import { TicketsService } from '../service/tickets.service';
import { AuthService } from '../../../../auth/service/auth.service';
import {
  ReciboPrintService,
  ReciboTicketImpresionExtra,
  ReciboPagoImpresionLinea,
  ReciboImpresionOpciones
} from '../service/recibo-print.service';
import { EstablecimientoService } from '../service/establecimiento.service';
import { ModoPrecioLista } from '../service/producto-desde-lista-ventas.service';
import {
  SelectorProductosComponent,
  SelectorProductosData,
  SelectorProductosResult
} from '../selector-productos/selector-productos.component';
import { EditarProductoComponent } from '../../productos/editar-producto/editar-producto.component';
import {
  PagoEfectivoCambioComponent,
  PagoEfectivoCambioData,
  PagoEfectivoCambioResultado,
  PagoEfectivoConfirmacion,
  ImprimirReciboTrasPagoOpciones
} from '../pago-efectivo-cambio/pago-efectivo-cambio.component';
import { IMPRIMIR_RECIBO_KEY } from '../imprimir-recibo-preference.constants';
import { EdicionTicketComponent } from '../edicion-ticket/edicion-ticket.component';
import { MetodosPagoComponent } from '../metodos-pago/metodos-pago.component';
import { FrontendActivityBufferService } from '../../../../core/monitoring/frontend-activity-buffer.service';
import { sanitizeActividadTexto } from '../../../../core/monitoring/frontend-ui-activity.util';
import { TicketsPosFocusService } from '../tickets/tickets-pos-focus.service';
import { FooterService } from '../../../../layouts/services/footer.service';
import { resolveProductSearchTerm } from '../util/barcode-scan.util';
import {
  MoverDetalleCantidadDialogComponent,
  MoverDetalleCantidadDialogData,
  MoverDetalleCantidadDialogResult,
  MoverDetalleCantidadLinea
} from './mover-detalle-cantidad-dialog.component';

const ESTADOS_RECIBO = {
  PENDIENTE_PAGO: 1,
  PAGADO: 2,
  ANULADO: 3,
  SIGLA_EDICION: 'ED'
} as const;

const CLIENTE_ANONIMO_ID = 1;

export interface TicketMoveOption {
  id: number;
  label: string;
}

interface TicketSplitMoveResult {
  sourceTicketId: number;
  targetTicketId: number;
  movedItemsCount: number;
  targetProductCount: number;
}

interface TargetDetalleRollback {
  type: 'delete-created' | 'restore-updated';
  detalleId: number;
  payload?: UpdateReciboDetalleRequest;
}

@Component({
  selector: 'detalle-ticket',
  host: {
    class: 'detalle-ticket-host'
  },
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    EdicionTicketComponent,
    MetodosPagoComponent
  ],
  templateUrl: './detalle-ticket.component.html',
  styleUrls: ['./detalle-ticket.component.scss']
})
export class DetalleTicketComponent implements OnChanges, OnInit, OnDestroy {
  @Input() ticket: any;
  @Input() reciboId: number | null = null;
  @Input() searchInputElement: HTMLInputElement | null = null;
  @Input() sessionId: number | null = null;
  @Input() ticketMoveOptions: TicketMoveOption[] = [];
  @Input() splitComment: string | null = null;
  /**
   * Ticket con CxC vigente: deshabilita medios de pago del footer
   * (cobranza desde el rail / Financiero → Cuentas por cobrar).
   */
  @Input() modoCredito = false;
  @Output() focusSearchInputRequest = new EventEmitter<void>();
  @Output() metodoPagoActualizado = new EventEmitter<void>();
  @Output() ticketProcesado = new EventEmitter<void>();
  @Output() moveToNewTicketRequested = new EventEmitter<void>();
  @Output() moveToExistingTicketRequested = new EventEmitter<number>();
  /** Total del ticket (suma detalles) tras cada cambio de ítems. */
  @Output() ticketTotalChanged = new EventEmitter<number>();
  /** Cajero intentó pagar con medios deshabilitados por CxC → mostrar ayuda. */
  @Output() guiaCreditoSolicitada = new EventEmitter<void>();
  /** El enlace ticket→recibo se recreó (recibo huérfano). El padre debe actualizar currentReciboId. */
  @Output() reciboReasignado = new EventEmitter<number>();

  recibo: ReciboDto | null = null;
  detalles: ReciboDetalleDto[] = [];
  /** Copia de líneas tomada antes de iniciar el pago (lista de 3 últimos + impresión). */
  detallesParaImprimir: ReciboDetalleDto[] = [];
  /** Datos de pago/cambio para la tirilla (efectivo u otro método). */
  private ticketImpresionExtras: ReciboTicketImpresionExtra | null = null;
  /** Consecutivo VTA-* devuelto al cerrar el pago (tirilla). */
  private documentoVentaConsecutivoPago: string | null = null;
  selectedDetalleIndex = -1;
  selectedDetalleIndices: number[] = [];
  editingDetalleIndex = -1;
  editingUnitarioIndex = -1;
  editingProductoIndex = -1;
  private startingEdit = false;
  private lastClickTime = 0;
  private isDoubleClickActive = false; // Nueva bandera para bloquear durante doble click
  private blockFocusRequest = false; // Bandera global para bloquear focusSearchInputRequest
  editingCantidadCtrl = new FormControl<string>('', { nonNullable: true });
  editingUnitarioCtrl = new FormControl<string>('', { nonNullable: true });
  editingProductoCtrl = new FormControl<string>('', { nonNullable: true });

  loading = false;
  detallesLoading = false;
  movingDetalles = false;
  contextMenuPosition = { x: 0, y: 0 };
  error: string | null = null;
  detallesError: string | null = null;

  productSearchCtrl = new FormControl('', { nonNullable: true });
  productSearchError: string | null = null;
  searchingProduct = false;
  showCreateProductFromSearchButton = false;
  availableTicketMoveOptions: TicketMoveOption[] = [];
  private lastSearchDisabled = false;
  private dialogAbierto = false;
  private destroy$ = new Subject<void>();
  @ViewChild('detalleList') detalleListRef?: ElementRef<HTMLDivElement>;
  @ViewChild('detalleHeader') detalleHeaderRef?: ElementRef<HTMLDivElement>;
  @ViewChild('detalleContextMenuTrigger')
  detalleContextMenuTrigger?: MatMenuTrigger;

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

  /** True cuando el ticket pertenece a una sesión distinta de la actual (otra sesión). */
  ticketDeOtraSesion = false;

  /** True cuando se debe mostrar la columna "Atendido" en la lista de detalles. */
  mostrarColumnaAtendido = false;
  private readonly historicoExpandidoDetalleIds = new Set<number>();
  private usuariosCachePorId = new Map<string, string>();
  private historicoRefreshIntervalId: ReturnType<typeof setInterval> | null =
    null;

  private readonly actividadUi = inject(FrontendActivityBufferService);
  /** Presente cuando DetalleTicket vive bajo TicketsComponent (providers). */
  private readonly posFocus = inject(TicketsPosFocusService, { optional: true });

  constructor(
    private reciboService: ReciboService,
    private reciboDetalleService: ReciboDetalleService,
    private productoPresentacionService: ProductoPresentacionService,
    private relationalProductService: RelationalProductService,
    private dialog: MatDialog,
    private metodoPagoService: MetodoPagoService,
    private ticketReciboService: TicketReciboService,
    private snackBar: MatSnackBar,
    private estadoRecibosService: EstadoRecibosService,
    private ticketsService: TicketsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fechaUtilService: FechaUtilService,
    private reciboPrintService: ReciboPrintService,
    private establecimientoService: EstablecimientoService,
    private footerService: FooterService
  ) {}

  ngOnInit(): void {
    this.establecimientoService
      .loadActual()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: () => undefined });
    this.cargarUsuariosDesdeStorage();
    this.productSearchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        // No trim: un solo espacio final (p. ej. "ron ") debe enviarse al API.
        const raw = value ?? '';
        const resolved = this.resolveProductSearchInput(raw);
        if (resolved === null) {
          return;
        }
        if (!resolved) {
          this.productSearchError = null;
          this.showCreateProductFromSearchButton = false;
          return;
        }
        this.showCreateProductFromSearchButton = false;
        this.performProductSearch(resolved, true);
      });
    this.focusSearchInputRequest.emit();
    this.cargarEstadosRecibos();
    this.cargarMetodosPago();
    this.updateSearchDisabled();
  }

  private updateSearchDisabled(): void {
    // No usar searchingProduct aquí: deshabilitar el input durante la consulta
    // hace que se pierdan pulsaciones si el usuario sigue escribiendo mientras
    // se abre el selector (término desactualizado / foco al modal).
    const disabled =
      !this.reciboId ||
      this.loading ||
      this.movingDetalles ||
      (!this.recibo && !!this.error);
    if (disabled !== this.lastSearchDisabled) {
      this.lastSearchDisabled = disabled;
      if (disabled) {
        this.productSearchCtrl.disable({ emitEvent: false });
      } else {
        this.productSearchCtrl.enable({ emitEvent: false });
      }
    }
  }

  /**
   * Ejecuta updateSearchDisabled en el siguiente tick para evitar NG0100 en el padre
   * (el padre enlaza mat-form-field a productSearchCtrl y vería el cambio en el mismo ciclo).
   */
  private scheduleUpdateSearchDisabled(): void {
    setTimeout(() => this.updateSearchDisabled(), 0);
  }

  ngOnDestroy(): void {
    this.footerService.clearFooterItems();
    this.detenerActualizacionHistorico();
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

    // Con texto en el buscador (p. ej. lectora pegando una URL/QR), no usar +/- como atajos.
    if (isSearchInput && (this.productSearchCtrl.value ?? '').length > 0) {
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
    // Recalcular ticketDeOtraSesion cuando cambia ticket o sessionId
    if ('ticket' in changes || 'sessionId' in changes) {
      this.actualizarTicketDeOtraSesion();
    }

    if ('reciboId' in changes) {
      const change = changes['reciboId'];
      const value = change.currentValue as number | null;
      const previous = change.previousValue as number | null;
      this.scheduleUpdateSearchDisabled();
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

  private unitPriceFromModo(product: Producto, modo: ModoPrecioLista): number {
    if (modo === 'precioUnidad') {
      const u = product.precioUnidad;
      if (u !== undefined && u !== null && !Number.isNaN(Number(u))) {
        return Number(u);
      }
    }
    return Number(product.precio ?? 0);
  }

  private codigoPresentacionFromModo(modo: ModoPrecioLista): string {
    return modo === 'precioUnidad' ? 'UNIDAD' : 'PAQUETE';
  }

  private ensurePresentaciones(
    product: Producto
  ): Promise<ProductoPresentacionDto[]> {
    if (product.presentaciones && product.presentaciones.length > 0) {
      return Promise.resolve(
        product.presentaciones as ProductoPresentacionDto[]
      );
    }
    if (!product.id) {
      return Promise.resolve([]);
    }
    return firstValueFrom(this.productoPresentacionService.ensure(product.id))
      .then((rows) => {
        product.presentaciones = rows;
        return rows;
      })
      .catch(() => []);
  }

  /**
   * Compara user-nombre del localStorage con ticket.atendidoPor.nombre.
   * Si son diferentes, el ticket fue atendido inicialmente por otro usuario.
   */
  private actualizarTicketDeOtraSesion(): void {
    const userNombre = localStorage.getItem('user-nombre');
    const atendidoPorNombre = this.ticket?.atendidoPor?.nombre ?? null;

    if (!userNombre || !atendidoPorNombre) {
      this.ticketDeOtraSesion = false;
      return;
    }

    this.ticketDeOtraSesion =
      userNombre.trim().toLowerCase() !==
      atendidoPorNombre.trim().toLowerCase();
  }

  /**
   * Determina si la columna "Atendido" debe mostrarse.
   * Condiciones: el cliente del recibo NO es "ANONIMO" y al menos 1 detalle
   * tiene nombreUsuarioAtendio (crudo del API) distinto al user-nombre del localStorage.
   */
  private actualizarMostrarColumnaAtendido(): void {
    const clienteNombre =
      this.recibo?.cliente?.nombre?.trim().toUpperCase() ?? '';
    if (!clienteNombre || clienteNombre === 'ANONIMO') {
      this.mostrarColumnaAtendido = false;
      return;
    }

    const userNombre =
      localStorage.getItem('user-nombre')?.trim().toLowerCase() ?? '';
    if (!userNombre) {
      this.mostrarColumnaAtendido = false;
      return;
    }

    this.mostrarColumnaAtendido = this.detalles.some(
      (det) =>
        det.nombreUsuarioAtendio != null &&
        det.nombreUsuarioAtendio.trim().length > 0 &&
        det.nombreUsuarioAtendio.trim().toLowerCase() !== userNombre
    );
  }

  /** Formatea la información de "Atendido" para una fila: NombreCorto (fecha). */
  formatAtendidoPor(det: ReciboDetalleDto): string {
    if (!det.nombreUsuarioAtendio) {
      return '';
    }
    const nombre = this.abreviarNombre(det.nombreUsuarioAtendio);
    const fecha = this.fechaUtilService.formatDate(det.fechaCreacion);
    return fecha ? `${nombre} ${fecha}` : nombre;
  }

  /** Abrevia un nombre completo: "Jhon Doe" → "Jhon D." */
  private abreviarNombre(nombre: string): string {
    const palabras = nombre.trim().split(/\s+/);
    if (palabras.length <= 1) {
      return nombre.trim();
    }
    return `${palabras[0]} ${palabras[1].charAt(0).toUpperCase()}.`;
  }

  hasHistoricoAcciones(det: ReciboDetalleDto): boolean {
    return (
      Array.isArray(det.historicoAcciones) && det.historicoAcciones.length > 0
    );
  }

  isHistoricoExpandido(det: ReciboDetalleDto): boolean {
    return this.historicoExpandidoDetalleIds.has(det.id);
  }

  toggleHistoricoAcciones(det: ReciboDetalleDto, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.hasHistoricoAcciones(det)) {
      return;
    }

    if (this.historicoExpandidoDetalleIds.has(det.id)) {
      this.historicoExpandidoDetalleIds.delete(det.id);
    } else {
      this.historicoExpandidoDetalleIds.add(det.id);
    }

    this.sincronizarActualizacionHistorico();
    // El botón recibe el foco al clic; devolverlo al buscador del ticket (lector / nombre).
    setTimeout(() => this.focusSearchInputRequest.emit(), 0);
  }

  private sincronizarActualizacionHistorico(): void {
    if (this.historicoExpandidoDetalleIds.size > 0) {
      this.iniciarActualizacionHistorico();
      return;
    }

    this.detenerActualizacionHistorico();
  }

  private iniciarActualizacionHistorico(): void {
    if (this.historicoRefreshIntervalId !== null) {
      return;
    }

    this.historicoRefreshIntervalId = setInterval(() => {
      if (this.historicoExpandidoDetalleIds.size === 0) {
        this.detenerActualizacionHistorico();
        return;
      }

      this.cdr.markForCheck();
    }, 60000);
  }

  private detenerActualizacionHistorico(): void {
    if (this.historicoRefreshIntervalId === null) {
      return;
    }

    clearInterval(this.historicoRefreshIntervalId);
    this.historicoRefreshIntervalId = null;
  }

  getHistoricoAccionesOrdenadas(
    det: ReciboDetalleDto
  ): ReciboDetalleHistoricoAccionDto[] {
    const historicoCronologico = [...(det.historicoAcciones ?? [])].sort(
      (a, b) => {
        const fechaA = this.fechaUtilService
          .parseDateAsLocal(a.fechaHora)
          .getTime();
        const fechaB = this.fechaUtilService
          .parseDateAsLocal(b.fechaHora)
          .getTime();
        return fechaA - fechaB;
      }
    );

    const accionesVisibles: ReciboDetalleHistoricoAccionDto[] = [];

    for (const accion of historicoCronologico) {
      const tipoAccion = accion.accion?.trim().toLowerCase();

      if (tipoAccion === 'agrega') {
        accionesVisibles.push(accion);
        continue;
      }

      if (tipoAccion === 'elimina' && accionesVisibles.length > 0) {
        accionesVisibles.pop();
      }
    }

    return accionesVisibles;
  }

  getDescripcionHistoricoAccion(
    det: ReciboDetalleDto,
    accion: ReciboDetalleHistoricoAccionDto
  ): string {
    const tiempo = this.fechaUtilService.formatDateConTiempoRelativo(
      accion.fechaHora
    );
    if (!this.debeMostrarUsuarioEnHistorico(det)) {
      return tiempo;
    }

    const usuario = this.obtenerNombreUsuarioHistorico(accion.usuarioId);
    return `${tiempo} por ${usuario}`;
  }

  private debeMostrarUsuarioEnHistorico(det: ReciboDetalleDto): boolean {
    const usuarioLogueado = this.normalizarNombreUsuario(
      this.authService.getNombre()
    );
    if (!usuarioLogueado) {
      return true;
    }

    return this.getHistoricoAccionesOrdenadas(det).some((accion) => {
      const nombreUsuario = this.normalizarNombreUsuario(
        this.obtenerNombreUsuarioHistorico(accion.usuarioId)
      );
      return !!nombreUsuario && nombreUsuario !== usuarioLogueado;
    });
  }

  private obtenerNombreUsuarioHistorico(
    usuarioId: string | null | undefined
  ): string {
    const usuarioIdNormalizado = usuarioId?.trim();
    if (!usuarioIdNormalizado) {
      return 'Usuario desconocido';
    }

    return (
      this.usuariosCachePorId.get(usuarioIdNormalizado) ?? 'Usuario desconocido'
    );
  }

  private normalizarNombreUsuario(nombre: string | null | undefined): string {
    return nombre?.trim().toLowerCase() ?? '';
  }

  searchAndAddProduct(): void {
    const searchValue = this.productSearchCtrl.value ?? '';
    if (!this.reciboId) {
      this.productSearchError = 'Seleccione un ticket válido.';
      this.showCreateProductFromSearchButton = false;
      return;
    }

    const resolved = this.resolveProductSearchInput(searchValue);
    if (resolved === null) {
      return;
    }
    if (!resolved) {
      this.productSearchError = 'Ingrese un código o nombre de producto.';
      this.showCreateProductFromSearchButton = false;
      return;
    }
    this.performProductSearch(resolved, false);
  }

  /**
   * Rechaza QR/URL o devuelve término listo para buscar (p. ej. EAN extraído del QR).
   * Conserva un espacio simple; solo colapsa 2+ espacios seguidos.
   */
  private resolveProductSearchInput(raw: string): string | null {
    const { rejected, term, message } = resolveProductSearchTerm(raw);
    if (rejected) {
      this.rejectQrOrUrlScan(message ?? '');
      return null;
    }
    if (term !== raw) {
      this.productSearchCtrl.setValue(term, { emitEvent: false });
    }
    return term;
  }

  private rejectQrOrUrlScan(message: string): void {
    this.searchingProduct = false;
    this.showCreateProductFromSearchButton = false;
    this.updateSearchDisabled();
    this.productSearchError = message;
    this.productSearchCtrl.setValue('', { emitEvent: false });
    this.focusSearchInputRequest.emit();
  }

  get canCreateProductFromSearch(): boolean {
    return this.showCreateProductFromSearchButton;
  }

  openNuevoProductoDesdeBusqueda(): void {
    const searchTerm = this.productSearchCtrl.value?.trim();
    if (!searchTerm || this.dialogAbierto) {
      return;
    }

    this.dialogAbierto = true;
    this.updateSearchDisabled();

    this.actividadUi.record(
      `despliega modal: editar-producto (nuevo desde búsqueda, ref: "${sanitizeActividadTexto(searchTerm, 80)}")`
    );

    const dialogRef = this.dialog.open(EditarProductoComponent, {
      width: '600px',
      data: { barcode: searchTerm },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: Producto | undefined) => {
      this.dialogAbierto = false;
      this.updateSearchDisabled();

      if (result) {
        this.showCreateProductFromSearchButton = false;
        this.addProductToRecibo(result);
        return;
      }

      this.focusSearchInputRequest.emit();
    });
  }

  private addProductToRecibo(
    product: Producto,
    modoPrecio: ModoPrecioLista = 'precio',
    opciones: { reintentoRecibo?: boolean; reciboId?: number } = {}
  ): void {
    const reciboId = opciones.reciboId ?? this.reciboId;
    if (!reciboId) {
      this.productSearchError = 'No hay un recibo seleccionado.';
      this.searchingProduct = false;
      this.showCreateProductFromSearchButton = false;
      this.updateSearchDisabled();
      return;
    }

    if (!product.id) {
      this.productSearchError = 'El producto no tiene un identificador válido.';
      this.searchingProduct = false;
      this.showCreateProductFromSearchButton = false;
      this.updateSearchDisabled();
      return;
    }

    void this.ensurePresentaciones(product).then((presentaciones) => {
      const codigo = this.codigoPresentacionFromModo(modoPrecio);
      const presentacion =
        presentaciones.find((p) => (p.codigo || '').toUpperCase() === codigo) ??
        presentaciones.find((p) => p.esDefaultVenta) ??
        presentaciones[0];
      const presentacionId = presentacion?.id ?? null;
      const unitPrice =
        presentacion != null
          ? Number(presentacion.precioVenta)
          : this.unitPriceFromModo(product, modoPrecio);

      // Identidad de línea = presentación (paquete vs unidad no se fusionan)
      const existingDetalleIndex = this.detalles.findIndex((det) => {
        if (presentacionId != null && det.presentacionId != null) {
          return det.presentacionId === presentacionId;
        }
        if (presentacionId != null) {
          return false;
        }
        return det.productoId === product.id;
      });

      if (existingDetalleIndex >= 0) {
        const existingDetalle = this.detalles[existingDetalleIndex];
        const currentCantidad = Number(existingDetalle.cantidad ?? 0);
        const lineUnit =
          currentCantidad > 0
            ? Number(existingDetalle.subtotal ?? 0) / currentCantidad
            : unitPrice;

        if (
          !existingDetalle.id ||
          lineUnit <= 0 ||
          !existingDetalle.reciboId ||
          !existingDetalle.productoId
        ) {
          this.productSearchError =
            'No se pudo actualizar el producto existente.';
          this.searchingProduct = false;
          this.showCreateProductFromSearchButton = false;
          this.updateSearchDisabled();
          this.focusSearchInputRequest.emit();
          return;
        }

        const newCantidad = currentCantidad + 1;
        const newSubtotal = lineUnit * newCantidad;
        const previousDetalle = { ...existingDetalle };

        const payload: UpdateReciboDetalleRequest = {
          reciboId: existingDetalle.reciboId,
          productoId: existingDetalle.productoId,
          presentacionId: existingDetalle.presentacionId ?? presentacionId,
          cantidad: newCantidad,
          subtotal: newSubtotal,
          precioUnitarioSnapshot: lineUnit
        };

        const optimisticDetalle: ReciboDetalleDto = {
          ...existingDetalle,
          presentacionId: payload.presentacionId,
          cantidad: newCantidad,
          subtotal: newSubtotal
        };

        const updatedList = [...this.detalles];
        updatedList[existingDetalleIndex] = optimisticDetalle;
        this.detalles = updatedList;
        this.recalculateTotal();
        this.setSelectedDetalles(
          [existingDetalleIndex],
          existingDetalleIndex,
          false
        );
        this.productSearchCtrl.setValue('');
        this.searchingProduct = false;
        this.showCreateProductFromSearchButton = false;
        this.updateSearchDisabled();
        this.productSearchError = null;
        this.focusSearchInputRequest.emit();
        this.scrollDetalleListToBottom();

        this.reciboDetalleService
          .updateDetalle(existingDetalle.id, payload)
          .subscribe({
            next: async (updatedDetalle) => {
              const detalleBackend =
                await this.prepararDetalleActualizado(updatedDetalle);
              const updatedListFinal = [...this.detalles];
              updatedListFinal[existingDetalleIndex] = {
                ...optimisticDetalle,
                ...detalleBackend,
                cantidad: newCantidad,
                subtotal: newSubtotal,
                producto: detalleBackend.producto ?? existingDetalle.producto
              };
              this.detalles = updatedListFinal;
              this.depurarHistoricosExpandidos();
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

      const cantidad = 1;
      const subtotal = unitPrice * cantidad;
      const payload: CreateReciboDetalleRequest = {
        reciboId,
        productoId: product.id!,
        presentacionId,
        cantidad,
        subtotal,
        precioUnitarioSnapshot: unitPrice
      };

      this.reciboDetalleService.createDetalle(payload).subscribe({
        next: (detalle) => {
          this.productSearchCtrl.setValue('');
          this.searchingProduct = false;
          this.showCreateProductFromSearchButton = false;
          this.updateSearchDisabled();
          this.productSearchError = null;
          const detalleConProducto: ReciboDetalleDto = detalle.producto
            ? detalle
            : {
                ...detalle,
                presentacionId: detalle.presentacionId ?? presentacionId,
                producto: {
                  id: product.id!,
                  barcode: product.barcode,
                  nombre: product.nombre,
                  precio: product.precio,
                  precioUnidad: product.precioUnidad ?? null,
                  precioCompra: product.precioCompra ?? 0,
                  foto: product.foto ?? null,
                  activate: (product as any).activate ?? 1,
                  presentaciones: product.presentaciones
                }
              };
          this.detalles = this.insertarDetalleJuntoAProducto(
            this.detalles,
            detalleConProducto
          );
          this.recalculateTotal();
          const nuevoIndex = this.detalles.findIndex(
            (d) =>
              d.id != null &&
              detalleConProducto.id != null &&
              d.id === detalleConProducto.id
          );
          const selectedIndex =
            nuevoIndex >= 0 ? nuevoIndex : this.detalles.length - 1;
          this.setSelectedDetalles([selectedIndex], selectedIndex, false);
          this.focusSearchInputRequest.emit();
          this.scrollDetalleListToBottom();
        },
        error: (err: unknown) => {
          console.error('Error agregando producto al recibo', err);
          if (!opciones.reintentoRecibo && this.esReciboHuerfano(err)) {
            void this.reenlazarReciboYReintentarAlta(product, modoPrecio);
            return;
          }
          this.productSearchError = 'No se pudo agregar el producto.';
          this.searchingProduct = false;
          this.showCreateProductFromSearchButton = false;
          this.updateSearchDisabled();
          this.focusSearchInputRequest.emit();
        }
      });
    });
  }

  private fetchRecibo(id: number): void {
    this.loading = true;
    this.documentoVentaConsecutivoPago = null;
    this.scheduleUpdateSearchDisabled();
    this.error = null;
    this.reciboService.getRecibo(id).subscribe({
      next: (resp) => {
        this.recibo = {
          ...resp,
          sesionId: this.sessionId ?? resp.sesionId
        };
        this.actualizarEstadoEdicion();
        this.loading = false;
        this.scheduleUpdateSearchDisabled();
        this.fetchDetalles(id);
      },
      error: (err: unknown) => {
        console.error('Error loading recibo', err);
        if (this.esHttpNotFound(err)) {
          void this.reenlazarReciboSiHuerfano(id);
          return;
        }
        this.recibo = null;
        this.estaEnEdicion = false;
        this.error = 'No se pudo cargar el recibo.';
        this.loading = false;
        this.scheduleUpdateSearchDisabled();
        this.detalles = [];
        this.detallesError = null;
        this.detallesLoading = false;
        this.setSelectedDetalles([], null, false);
      }
    });
  }

  private async reenlazarReciboYReintentarAlta(
    product: Producto,
    modoPrecio: ModoPrecioLista
  ): Promise<void> {
    const nuevoId = await this.obtenerReciboVigenteDelTicket();
    if (nuevoId == null) {
      this.productSearchError = 'No se pudo agregar el producto.';
      this.searchingProduct = false;
      this.showCreateProductFromSearchButton = false;
      this.updateSearchDisabled();
      this.focusSearchInputRequest.emit();
      return;
    }
    this.addProductToRecibo(product, modoPrecio, {
      reintentoRecibo: true,
      reciboId: nuevoId
    });
  }

  private async reenlazarReciboSiHuerfano(reciboIdFallido: number): Promise<void> {
    const nuevoId = await this.obtenerReciboVigenteDelTicket();
    if (nuevoId == null || nuevoId === reciboIdFallido) {
      this.recibo = null;
      this.estaEnEdicion = false;
      this.error = 'No se pudo cargar el recibo.';
      this.loading = false;
      this.scheduleUpdateSearchDisabled();
      this.detalles = [];
      this.detallesError = null;
      this.detallesLoading = false;
      this.setSelectedDetalles([], null, false);
      return;
    }
    this.loading = false;
    this.scheduleUpdateSearchDisabled();
  }

  private async obtenerReciboVigenteDelTicket(): Promise<number | null> {
    const ticketId = this.ticket?.id;
    if (ticketId == null || this.sessionId == null) {
      return null;
    }
    try {
      const relation = await firstValueFrom(
        this.ticketReciboService.getByTicketId(ticketId, this.sessionId)
      );
      const nuevoId = relation?.reciboId ?? null;
      if (nuevoId != null && nuevoId !== this.reciboId) {
        this.reciboReasignado.emit(nuevoId);
      }
      return nuevoId;
    } catch {
      return null;
    }
  }

  private esReciboHuerfano(err: unknown): boolean {
    if (!(err instanceof HttpErrorResponse)) {
      return false;
    }
    if (err.status === 404) {
      return true;
    }
    if (err.status !== 409) {
      return false;
    }
    const descripcion = String(
      err.error?.errores?.[0]?.descripcionError ?? err.error?.message ?? ''
    );
    return (
      descripcion.includes('fk_recibo_detalle_recibo') ||
      descripcion.includes('recibo_id')
    );
  }

  private esHttpNotFound(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 404;
  }

  private fetchDetalles(reciboId: number): void {
    this.detallesLoading = true;
    this.detallesError = null;
    this.reciboDetalleService.getDetallesByRecibo(reciboId).subscribe({
      next: (detalles) => {
        void this.procesarDetallesCargados(detalles || []);
      },
      error: (err: unknown) => {
        console.error('Error loading recibo detalles', err);
        this.detalles = [];
        this.detallesError = 'No se pudieron cargar los detalles del recibo.';
        this.detallesLoading = false;
        this.recalculateTotal();
        this.setSelectedDetalles([], null, false);
      }
    });
  }

  private async procesarDetallesCargados(
    detalles: ReciboDetalleDto[]
  ): Promise<void> {
    this.detalles = this.agruparDetallesPorProducto(detalles);
    this.depurarHistoricosExpandidos();
    this.detallesLoading = false;
    this.recalculateTotal();
    this.setSelectedDetalles(this.detalles.length ? [0] : [], 0, false);
    this.actualizarMostrarColumnaAtendido();
    this.cdr.markForCheck();

    try {
      await this.sincronizarCacheUsuariosHistorico(this.detalles);
    } catch (error) {
      console.warn(
        'No se pudo sincronizar la caché de usuarios para el histórico:',
        error
      );
    }
    this.cdr.markForCheck();
  }

  private async sincronizarCacheUsuariosHistorico(
    detalles: ReciboDetalleDto[]
  ): Promise<void> {
    this.cargarUsuariosDesdeStorage();
    let faltantes = this.obtenerUsuarioIdsFaltantesEnHistorico(detalles);
    if (!faltantes.length) {
      return;
    }

    try {
      await firstValueFrom(this.authService.cargarTodosUsuariosEnStorage(false));
    } finally {
      this.cargarUsuariosDesdeStorage();
    }

    faltantes = this.obtenerUsuarioIdsFaltantesEnHistorico(detalles);
    if (!faltantes.length) {
      return;
    }

    try {
      await firstValueFrom(this.authService.cargarTodosUsuariosEnStorage(true));
    } finally {
      this.cargarUsuariosDesdeStorage();
    }
  }

  private async prepararDetalleActualizado(
    detalle: ReciboDetalleDto
  ): Promise<ReciboDetalleDto> {
    try {
      await this.sincronizarCacheUsuariosHistorico([detalle]);
    } catch (error) {
      console.warn(
        'No se pudo sincronizar la caché de usuarios para el detalle actualizado:',
        error
      );
    }

    return detalle;
  }

  private cargarUsuariosDesdeStorage(): void {
    const usuarios = this.authService.obtenerTodosUsuariosCache();
    this.usuariosCachePorId = new Map(
      usuarios.map((usuario) => [usuario.id, usuario.nombre])
    );
  }

  private obtenerUsuarioIdsFaltantesEnHistorico(
    detalles: ReciboDetalleDto[]
  ): string[] {
    const faltantes = new Set<string>();

    for (const detalle of detalles) {
      for (const accion of detalle.historicoAcciones ?? []) {
        const usuarioId = accion.usuarioId?.trim();
        if (usuarioId && !this.usuariosCachePorId.has(usuarioId)) {
          faltantes.add(usuarioId);
        }
      }
    }

    return Array.from(faltantes);
  }

  private depurarHistoricosExpandidos(): void {
    const detalleIdsConHistorico = new Set(
      this.detalles
        .filter((detalle) => this.hasHistoricoAcciones(detalle))
        .map((detalle) => detalle.id)
    );

    for (const detalleId of Array.from(this.historicoExpandidoDetalleIds)) {
      if (!detalleIdsConHistorico.has(detalleId)) {
        this.historicoExpandidoDetalleIds.delete(detalleId);
      }
    }

    this.sincronizarActualizacionHistorico();
  }

  private resetState(): void {
    this.recibo = null;
    this.detalles = [];
    this.historicoExpandidoDetalleIds.clear();
    this.detenerActualizacionHistorico();
    this.error = null;
    this.detallesError = null;
    this.loading = false;
    this.detallesLoading = false;
    this.productSearchCtrl.setValue('');
    this.productSearchError = null;
    this.searchingProduct = false;
    this.showCreateProductFromSearchButton = false;
    this.ticketImpresionExtras = null;
    this.documentoVentaConsecutivoPago = null;
    this.dialogAbierto = false;
    this.estaEnEdicion = false;
    this.setSelectedDetalles([], null, false);
    this.updateSearchDisabled();
    this.focusSearchInputRequest.emit();
  }

  private emitPaymentProcessedEvents(): void {
    setTimeout(() => {
      this.ticketProcesado.emit();
      this.metodoPagoActualizado.emit();
    }, 0);
  }

  /** Debe llamarse antes de cualquier flujo que registre el pago (efectivo u otro método). */
  private snapshotDetallesAntesDelPago(): void {
    if (this.detalles?.length) {
      this.detallesParaImprimir = [...this.detalles];
    }
  }

  private cacheRecentReciboForReprint(): void {
    if (!this.recibo) {
      return;
    }

    const detallesFuente = this.detallesParaImprimir?.length
      ? this.detallesParaImprimir
      : this.detalles;
    if (!detallesFuente?.length) {
      return;
    }

    this.reciboPrintService.registerRecentRecibo(
      this.recibo,
      this.reciboPrintService.toPrintableDetalles(detallesFuente),
      this.ticket?.cliente?.nombre,
      this.ticketImpresionExtras
    );
  }

  private opcionesImpresionRecibo(
    detalles: ReciboDetalleDto[],
    fechaEmision?: Date | null
  ): ReciboImpresionOpciones {
    return {
      detalles: this.reciboPrintService.toPrintableDetalles(detalles),
      fechaCreacion: this.recibo?.fechaCreacion,
      fechaEmision: fechaEmision ?? undefined,
      clienteNombre:
        this.recibo?.cliente?.nombre ?? this.ticket?.cliente?.nombre,
      establecimiento: ReciboPrintService.toImpresionEstablecimiento(
        this.establecimientoService.getSnapshot()
      ),
      documentoVentaConsecutivo: this.documentoVentaConsecutivoPago,
      ...this.ticketImpresionExtras
    };
  }

  private capturarConsecutivoDocumentoVenta(resp: ActualizarReciboResponse): void {
    if (isReciboPagoResponse(resp) && resp.documentoVentaConsecutivo?.trim()) {
      this.documentoVentaConsecutivoPago = resp.documentoVentaConsecutivo.trim();
    }
  }

  private mergeActualizarReciboResponse(
    current: ReciboDto,
    resp: ActualizarReciboResponse
  ): ReciboDto {
    if (isReciboPagoResponse(resp)) {
      this.capturarConsecutivoDocumentoVenta(resp);
      return {
        ...current,
        total: resp.total ?? current.total,
        metodoPagoId: resp.metodoPagoId ?? current.metodoPagoId,
        clienteId: resp.clienteId ?? current.clienteId,
        sesionId: resp.sesionId ?? current.sesionId
      };
    }
    return resp;
  }

  private aplicarExtrasImpresionMetodoDirecto(
    metodo: MetodoPagoDto,
    totalARegistrar: number
  ): void {
    this.ticketImpresionExtras = {
      metodoPagoLabel: metodo.descripcion ?? null,
      montoRecibido: totalARegistrar,
      cambio: 0,
      pagosLineas: [
        {
          metodoPagoId: metodo.id,
          label: metodo.descripcion ?? `Medio ${metodo.id}`,
          monto: totalARegistrar
        }
      ]
    };
  }

  private performProductSearch(
    term: string,
    triggeredAutomatically: boolean
  ): void {
    if (this.searchingProduct || this.dialogAbierto) {
      return;
    }
    if (!this.reciboId) {
      this.productSearchError = 'Seleccione un ticket válido.';
      return;
    }

    const resolved = this.resolveProductSearchInput(term);
    if (resolved === null) {
      return;
    }
    term = resolved;

    this.productSearchError = null;
    this.searchingProduct = true;
    this.showCreateProductFromSearchButton = false;
    this.updateSearchDisabled();
    this.relationalProductService.getProducts(term, 0, 1, true).subscribe({
      next: (page: ProductPage) => {
        const latestResolved = this.resolveProductSearchInput(
          this.productSearchCtrl.value ?? ''
        );
        if (latestResolved === null) {
          return;
        }
        if (latestResolved !== term) {
          this.searchingProduct = false;
          this.updateSearchDisabled();
          if (latestResolved) {
            this.performProductSearch(latestResolved, triggeredAutomatically);
          }
          return;
        }

        const total = page?.totalElements ?? page?.content?.length ?? 0;
        const products = page?.content ?? [];
        if (total === 1 && products[0]) {
          this.showCreateProductFromSearchButton = false;
          this.addProductToRecibo(products[0]);
          return;
        }

        this.searchingProduct = false;
        this.updateSearchDisabled();

        const termForSelector = latestResolved || term;

        if (total === 0) {
          this.showCreateProductFromSearchButton = termForSelector.length > 0;
          if (triggeredAutomatically) {
            this.focusSearchInputRequest.emit();
            return;
          }

          this.openSelectorProductosDialog(termForSelector);
          return;
        }

        this.openSelectorProductosDialog(termForSelector);
      },
      error: (err: unknown) => {
        console.error('Error searching product', err);
        this.searchingProduct = false;
        this.showCreateProductFromSearchButton = false;
        this.updateSearchDisabled();
        if (!triggeredAutomatically) {
          this.productSearchError = 'Error al buscar el producto.';
        }
        this.focusSearchInputRequest.emit();
      }
    });
  }

  private openSelectorProductosDialog(term: string): void {
    if (this.dialogAbierto) {
      return;
    }

    this.dialogAbierto = true;
    this.posFocus?.hold('dialog:selector-productos');
    const termLog = sanitizeActividadTexto(term, 120);
    this.actividadUi.record(
      `despliega modal: selector-productos (#productSearchInput, búsqueda: "${termLog}")`
    );
    const dialogRef = this.dialog.open<
      SelectorProductosComponent,
      SelectorProductosData,
      SelectorProductosResult
    >(SelectorProductosComponent, {
      width: '1040px',
      maxWidth: '96vw',
      data: { term },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((selected) => {
      this.dialogAbierto = false;
      this.searchingProduct = false;
      this.showCreateProductFromSearchButton = false;
      this.updateSearchDisabled();
      this.posFocus?.releaseQuiet('dialog:selector-productos');
      if (selected) {
        // Limpia de inmediato para que un keyup tardío u otra acción no relance
        // búsqueda con el mismo término mientras createDetalle sigue en curso.
        this.productSearchCtrl.setValue('', { emitEvent: false });
        this.addProductToRecibo(selected.product, selected.modoPrecio);
      } else {
        this.focusSearchInputRequest.emit();
      }
    });
  }

  private recalculateTotal(): number {
    if (!this.recibo) {
      this.actualizarFooterSeleccion();
      this.ticketTotalChanged.emit(0);
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
    this.actualizarFooterSeleccion();
    this.ticketTotalChanged.emit(sum);
    return sum;
  }

  private sonPreciosEquivalentes(
    a: number | null | undefined,
    b: number | null | undefined
  ): boolean {
    return Math.abs(Number(a ?? 0) - Number(b ?? 0)) < 0.0001;
  }

  private getPrecioUnidadDetalle(detalle: ReciboDetalleDto): number | null {
    const precioUnidad = detalle.producto?.precioUnidad;
    if (precioUnidad !== null && precioUnidad !== undefined) {
      const numericValue = Number(precioUnidad);
      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }

    const fromPresentacion =
      detalle.producto?.presentaciones?.find(
        (p) => (p.codigo || '').toUpperCase() === 'UNIDAD'
      )?.precioVenta ??
      (detalle.presentacion?.codigo?.toUpperCase() === 'UNIDAD'
        ? detalle.presentacion.precioVenta
        : null);

    if (fromPresentacion === null || fromPresentacion === undefined) {
      return null;
    }
    const numericFromPres = Number(fromPresentacion);
    return Number.isFinite(numericFromPres) ? numericFromPres : null;
  }

  getDetalleUnitario(detalle: ReciboDetalleDto): number {
    const cantidad = Number(detalle?.cantidad ?? 0);
    const subtotal = Number(detalle?.subtotal ?? 0);

    if (cantidad > 0) {
      return subtotal / cantidad;
    }

    return Number(detalle.producto?.precio ?? 0);
  }

  /**
   * Agrupa líneas del mismo producto base para que paquete y unidad queden juntas.
   * Conserva el orden de primera aparición de cada producto.
   */
  private agruparDetallesPorProducto(
    detalles: ReciboDetalleDto[]
  ): ReciboDetalleDto[] {
    if (!detalles.length) {
      return detalles;
    }

    const result: ReciboDetalleDto[] = [];
    const seenProductoIds = new Set<number | string>();

    for (const detalle of detalles) {
      const key =
        detalle.productoId != null ? detalle.productoId : `row-${result.length}`;
      if (seenProductoIds.has(key)) {
        continue;
      }
      seenProductoIds.add(key);

      const grupo = detalles.filter((d) =>
        detalle.productoId != null
          ? d.productoId === detalle.productoId
          : d === detalle
      );

      grupo.sort((a, b) => {
        const aUnidad = this.esLineaPorUnidad(a) ? 1 : 0;
        const bUnidad = this.esLineaPorUnidad(b) ? 1 : 0;
        return aUnidad - bUnidad;
      });

      result.push(...grupo);
    }

    return result;
  }

  /** Inserta la nueva línea justo después de la última del mismo producto base. */
  private insertarDetalleJuntoAProducto(
    detalles: ReciboDetalleDto[],
    nuevo: ReciboDetalleDto
  ): ReciboDetalleDto[] {
    if (nuevo.productoId == null) {
      return [...detalles, nuevo];
    }

    let lastSiblingIndex = -1;
    for (let i = 0; i < detalles.length; i++) {
      if (detalles[i].productoId === nuevo.productoId) {
        lastSiblingIndex = i;
      }
    }

    if (lastSiblingIndex < 0) {
      return [...detalles, nuevo];
    }

    const updated = [...detalles];
    updated.splice(lastSiblingIndex + 1, 0, nuevo);
    return this.agruparDetallesPorProducto(updated);
  }

  tienePrecioUnidad(detalle: ReciboDetalleDto): boolean {
    return this.getPrecioUnidadDetalle(detalle) !== null;
  }

  /**
   * True si la línea se vendió como UNIDAD (menudeo), no como paquete/empaque.
   */
  esLineaPorUnidad(detalle: ReciboDetalleDto): boolean {
    const codigo = (
      detalle.presentacion?.codigo ||
      detalle.producto?.presentaciones?.find(
        (p) => p.id === detalle.presentacionId
      )?.codigo ||
      ''
    )
      .trim()
      .toUpperCase();
    if (codigo === 'UNIDAD') {
      return true;
    }
    if (codigo === 'PAQUETE') {
      return false;
    }
    return this.estaUsandoPrecioUnidad(detalle);
  }

  /**
   * Mismo producto base ya tiene en el ticket al menos una línea unidad y una paquete.
   */
  tieneAmbasPresentacionesEnTicket(productoId: number | null | undefined): boolean {
    if (productoId == null) {
      return false;
    }
    const lineas = this.detalles.filter((d) => d.productoId === productoId);
    if (lineas.length < 2) {
      return false;
    }
    const hayUnidad = lineas.some((d) => this.esLineaPorUnidad(d));
    const hayPaquete = lineas.some((d) => !this.esLineaPorUnidad(d));
    return hayUnidad && hayPaquete;
  }

  /** Toggle solo si hay menudeo y aún no coexisten ambas presentaciones en el ticket. */
  mostrarTogglePrecioUnidad(detalle: ReciboDetalleDto): boolean {
    return (
      this.tienePrecioUnidad(detalle) &&
      !this.tieneAmbasPresentacionesEnTicket(detalle.productoId)
    );
  }

  estaUsandoPrecioUnidad(detalle: ReciboDetalleDto): boolean {
    const codigo = (
      detalle.presentacion?.codigo ||
      detalle.producto?.presentaciones?.find(
        (p) => p.id === detalle.presentacionId
      )?.codigo ||
      ''
    )
      .trim()
      .toUpperCase();
    if (codigo === 'UNIDAD') {
      return true;
    }
    if (codigo === 'PAQUETE') {
      return false;
    }

    const precioUnidad = this.getPrecioUnidadDetalle(detalle);
    if (precioUnidad === null) {
      return false;
    }

    return this.sonPreciosEquivalentes(
      this.getDetalleUnitario(detalle),
      precioUnidad
    );
  }

  getPrecioUnidadToggleTooltip(detalle: ReciboDetalleDto): string {
    return this.estaUsandoPrecioUnidad(detalle)
      ? 'Usar precio por empaque'
      : 'Usar precio por unidad';
  }

  togglePrecioUnidad(
    detalle: ReciboDetalleDto,
    index: number,
    event: MouseEvent
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (
      !detalle.id ||
      !detalle.reciboId ||
      !detalle.productoId ||
      !detalle.cantidad ||
      !detalle.producto
    ) {
      return;
    }

    const product = detalle.producto as Producto;
    void this.ensurePresentaciones(product).then((presentaciones) => {
      if (!presentaciones.length) {
        console.warn(
          'No hay presentaciones para alternar precio unidad/empaque'
        );
        return;
      }

      // Releer la línea por si el índice cambió tras agrupar
      const currentIndex = this.detalles.findIndex((d) => d.id === detalle.id);
      const lineIndex = currentIndex >= 0 ? currentIndex : index;
      const line = this.detalles[lineIndex] ?? detalle;

      const usingUnidad = this.estaUsandoPrecioUnidad(line);
      const targetCodigo = usingUnidad ? 'PAQUETE' : 'UNIDAD';
      const targetPresentacion =
        presentaciones.find(
          (p) => (p.codigo || '').toUpperCase() === targetCodigo
        ) ?? null;

      if (!targetPresentacion?.id) {
        console.warn(
          `No se encontró presentación ${targetCodigo} para el producto`,
          line.productoId
        );
        return;
      }

      const precioUnidadFallback = this.getPrecioUnidadDetalle(line);
      const precioPaqueteFallback = Number(
        line.producto?.precio ?? this.getDetalleUnitario(line)
      );
      const unitPrice =
        targetPresentacion.precioVenta != null &&
        Number.isFinite(Number(targetPresentacion.precioVenta))
          ? Number(targetPresentacion.precioVenta)
          : targetCodigo === 'UNIDAD'
            ? (precioUnidadFallback ?? precioPaqueteFallback)
            : precioPaqueteFallback;

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return;
      }

      const newSubtotal = unitPrice * Number(line.cantidad);
      const samePrice = this.sonPreciosEquivalentes(
        newSubtotal,
        Number(line.subtotal ?? 0)
      );
      const samePresentacion = line.presentacionId === targetPresentacion.id;
      if (samePrice && samePresentacion) {
        return;
      }

      const previousDetalle = { ...line };
      const payload: UpdateReciboDetalleRequest = {
        reciboId: line.reciboId,
        productoId: line.productoId,
        presentacionId: targetPresentacion.id,
        cantidad: line.cantidad,
        subtotal: newSubtotal,
        precioUnitarioSnapshot: unitPrice
      };

      const presentacionSnapshot = {
        id: targetPresentacion.id,
        codigo: targetPresentacion.codigo,
        nombreMostrar: targetPresentacion.nombreMostrar,
        factorABase: targetPresentacion.factorABase,
        precioVenta: Number(targetPresentacion.precioVenta)
      };

      const optimisticDetalle: ReciboDetalleDto = {
        ...line,
        presentacionId: targetPresentacion.id,
        presentacion: presentacionSnapshot,
        precioUnitarioSnapshot: unitPrice,
        subtotal: newSubtotal,
        producto: {
          ...line.producto!,
          presentaciones:
            line.producto?.presentaciones ?? presentaciones
        }
      };

      const updatedList = [...this.detalles];
      updatedList[lineIndex] = optimisticDetalle;
      this.detalles = updatedList;
      this.recalculateTotal();
      this.cdr.markForCheck();

      this.reciboDetalleService.updateDetalle(line.id, payload).subscribe({
        next: async (updatedDetalle) => {
          const detalleBackend =
            await this.prepararDetalleActualizado(updatedDetalle);
          const idx = this.detalles.findIndex((d) => d.id === line.id);
          if (idx < 0) {
            return;
          }
          const updatedListFinal = [...this.detalles];
          updatedListFinal[idx] = {
            ...optimisticDetalle,
            ...detalleBackend,
            presentacionId:
              detalleBackend.presentacionId ?? targetPresentacion.id,
            presentacion:
              detalleBackend.presentacion ?? presentacionSnapshot,
            subtotal: newSubtotal,
            precioUnitarioSnapshot:
              detalleBackend.precioUnitarioSnapshot ?? unitPrice,
            producto: {
              ...(detalleBackend.producto ?? line.producto!),
              presentaciones:
                (detalleBackend.producto as Producto | undefined)
                  ?.presentaciones ??
                line.producto?.presentaciones ??
                presentaciones
            }
          };
          this.detalles = updatedListFinal;
          this.depurarHistoricosExpandidos();
          const finalTotal = this.recalculateTotal();
          this.cdr.markForCheck();

          if (this.recibo) {
            try {
              this.recibo = await this.updateReciboTotal(this.recibo, finalTotal);
              this.metodoPagoActualizado.emit();
            } catch (err) {
              console.error(
                'Error updating recibo total after unit price toggle',
                err
              );
            }
          }
        },
        error: (err: unknown) => {
          const revertedList = [...this.detalles];
          const idx = this.detalles.findIndex((d) => d.id === line.id);
          if (idx >= 0) {
            revertedList[idx] = previousDetalle;
            this.detalles = revertedList;
            this.recalculateTotal();
            this.cdr.markForCheck();
          }
          console.error('Error toggling detalle unit price', err);
        }
      });
    });
  }

  onDetalleRowMouseDown(index: number, event: MouseEvent): void {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastClickTime;

    // Si es un doble clic (menos de 300ms entre clics), prevenir el click
    if (timeDiff < 300) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.lastClickTime = currentTime;
  }

  onDetalleRowClick(index: number, event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Verificar si el clic fue en un input de edición activo
    if (
      target.classList.contains('producto-input') ||
      target.classList.contains('valor-unitario-input') ||
      target.classList.contains('cantidad-input')
    ) {
      // No hacer nada si el clic fue en inputs de edición activos
      return;
    }

    // Prevenir selección si hay edición en línea de celda, moviendo líneas o doble clic activo.
    // En edición de recibo (estaEnEdicion) sí debe poder seleccionarse para cantidad +/- o borrado.
    if (
      this.startingEdit ||
      this.editingProductoIndex !== -1 ||
      this.editingUnitarioIndex !== -1 ||
      this.editingDetalleIndex !== -1 ||
      this.movingDetalles ||
      this.isDoubleClickActive
    ) {
      return;
    }

    this.selectDetalle(index, event.ctrlKey || event.metaKey);
  }

  selectDetalle(index: number, appendToSelection: boolean = false): void {
    // No hacer nada si se está iniciando una edición
    if (this.startingEdit) {
      return;
    }

    if (index < 0 || index >= this.detalles.length) {
      this.setSelectedDetalles([], null, false);
      return;
    }

    if (!appendToSelection) {
      this.setSelectedDetalles([index], index);
      return;
    }

    const alreadySelected = this.selectedDetalleIndices.includes(index);
    const nextSelection = alreadySelected
      ? this.selectedDetalleIndices.filter(
          (selectedIndex) => selectedIndex !== index
        )
      : [...this.selectedDetalleIndices, index];

    this.setSelectedDetalles(
      nextSelection,
      alreadySelected ? null : index,
      !alreadySelected
    );
  }

  isDetalleSelected(index: number): boolean {
    return this.selectedDetalleIndices.includes(index);
  }

  /** Selecciona todas las líneas (p. ej. mover productos a ticket con cliente existente). */
  selectAllDetalles(): void {
    if (!this.detalles.length) {
      this.setSelectedDetalles([], null, false);
      return;
    }
    const indices = this.detalles.map((_, index) => index);
    this.setSelectedDetalles(indices, 0, false);
  }

  onDetalleContextMenu(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (
      this.estaEnEdicion ||
      this.movingDetalles ||
      index < 0 ||
      index >= this.detalles.length
    ) {
      return;
    }

    if (!this.selectedDetalleIndices.includes(index)) {
      this.setSelectedDetalles([index], index, false);
    }

    this.openDetalleContextMenu(event);
  }

  onDetalleListContextMenu(event: MouseEvent): void {
    event.preventDefault();

    if (
      !this.selectedDetalleIndices.length ||
      this.estaEnEdicion ||
      this.movingDetalles
    ) {
      return;
    }

    this.openDetalleContextMenu(event);
  }

  requestMoveSelectedDetallesToNewTicket(): void {
    if (!this.selectedDetalleIndices.length || this.movingDetalles) {
      return;
    }

    this.closeDetalleContextMenu();
    this.moveToNewTicketRequested.emit();
  }

  requestMoveSelectedDetallesToExistingTicket(ticketId: number): void {
    if (!this.selectedDetalleIndices.length || this.movingDetalles) {
      return;
    }

    this.closeDetalleContextMenu();
    this.moveToExistingTicketRequested.emit(ticketId);
  }

  /**
   * Si alguna línea seleccionada tiene cantidad &gt; 1, pide cuántas mover.
   * @returns mapa detalleId → cantidad a mover, o null si el usuario cancela.
   */
  async confirmMoveQuantitiesIfNeeded(
    destinoLabel?: string
  ): Promise<Map<number, number> | null> {
    const detallesSeleccionados = this.selectedDetalleIndices
      .map((index) => this.detalles[index])
      .filter((detalle): detalle is ReciboDetalleDto => !!detalle);

    if (!detallesSeleccionados.length) {
      return null;
    }

    const lineasConCantidadMayorAUno = detallesSeleccionados.filter(
      (d) => Number(d.cantidad ?? 0) > 1
    );

    const qtyMap = new Map<number, number>();
    for (const d of detallesSeleccionados) {
      qtyMap.set(d.id, Number(d.cantidad ?? 0));
    }

    if (!lineasConCantidadMayorAUno.length) {
      return qtyMap;
    }

    const lineas: MoverDetalleCantidadLinea[] =
      lineasConCantidadMayorAUno.map((d) => ({
        detalleId: d.id,
        productoNombre:
          d.producto?.nombre?.trim() ||
          `Producto ${d.productoId ?? d.id}`,
        cantidadActual: Number(d.cantidad ?? 0),
        cantidadMover: Number(d.cantidad ?? 0)
      }));

    this.posFocus?.hold('dialog:mover-cantidad');
    const dialogRef = this.dialog.open<
      MoverDetalleCantidadDialogComponent,
      MoverDetalleCantidadDialogData,
      MoverDetalleCantidadDialogResult | undefined
    >(MoverDetalleCantidadDialogComponent, {
      width: '440px',
      maxWidth: '96vw',
      disableClose: true,
      autoFocus: true,
      data: { lineas, destinoLabel }
    });

    try {
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (!result?.cantidades) {
        return null;
      }
      for (const [idStr, qty] of Object.entries(result.cantidades)) {
        qtyMap.set(Number(idStr), Number(qty));
      }
      return qtyMap;
    } finally {
      this.posFocus?.releaseQuiet('dialog:mover-cantidad');
    }
  }

  async moveSelectedDetallesToTicket(
    targetTicketId: number,
    reciboPadreId?: number,
    cantidadesPorDetalle?: Map<number, number> | null
  ): Promise<TicketSplitMoveResult | null> {
    if (
      !this.reciboId ||
      !this.recibo ||
      !this.ticket?.id ||
      this.sessionId === null
    ) {
      return null;
    }

    if (
      !this.selectedDetalleIndices.length ||
      targetTicketId === this.ticket.id
    ) {
      return null;
    }

    const detallesSeleccionados = this.selectedDetalleIndices
      .map((index) => this.detalles[index])
      .filter((detalle): detalle is ReciboDetalleDto => !!detalle);

    if (!detallesSeleccionados.length) {
      return null;
    }

    const qtyMap =
      cantidadesPorDetalle ?? (await this.confirmMoveQuantitiesIfNeeded());
    if (!qtyMap) {
      return null;
    }

    this.movingDetalles = true;
    this.updateSearchDisabled();
    this.closeDetalleContextMenu();

    try {
      const targetRelation = await firstValueFrom(
        this.ticketReciboService.getByTicketId(
          targetTicketId,
          this.sessionId,
          reciboPadreId
        )
      );

      if (!targetRelation?.reciboId) {
        throw new Error('No se encontró el recibo asociado al ticket destino.');
      }

      const [targetRecibo, targetDetallesResponse] = await Promise.all([
        firstValueFrom(this.reciboService.getRecibo(targetRelation.reciboId)),
        firstValueFrom(
          this.reciboDetalleService.getDetallesByRecibo(targetRelation.reciboId)
        )
      ]);

      let targetDetalles = [...(targetDetallesResponse ?? [])];
      let movedLinesCount = 0;

      for (const detalle of detallesSeleccionados) {
        const qtyCurrent = Number(detalle.cantidad ?? 0);
        const qtyMove = Number(qtyMap.get(detalle.id) ?? qtyCurrent);
        if (!Number.isFinite(qtyMove) || qtyMove <= 0) {
          continue;
        }
        const qtyToMove = Math.min(qtyMove, qtyCurrent);
        if (qtyToMove <= 0) {
          continue;
        }

        const unitPrice = this.getDetalleUnitario(detalle);
        const subtotalMove = unitPrice * qtyToMove;
        const qtyRemain = qtyCurrent - qtyToMove;
        const subtotalRemain = unitPrice * qtyRemain;

        const existingTargetIndex = targetDetalles.findIndex(
          (targetDetalle) => {
            if (
              detalle.presentacionId != null &&
              targetDetalle.presentacionId != null
            ) {
              return targetDetalle.presentacionId === detalle.presentacionId;
            }
            if (detalle.presentacionId != null) {
              return false;
            }
            return targetDetalle.productoId === detalle.productoId;
          }
        );

        let rollback: TargetDetalleRollback;

        if (existingTargetIndex >= 0) {
          const detalleDestino = targetDetalles[existingTargetIndex];
          const payload: UpdateReciboDetalleRequest = {
            reciboId: detalleDestino.reciboId,
            productoId: detalleDestino.productoId,
            presentacionId:
              detalleDestino.presentacionId ?? detalle.presentacionId,
            cantidad: Number(detalleDestino.cantidad ?? 0) + qtyToMove,
            subtotal: Number(detalleDestino.subtotal ?? 0) + subtotalMove,
            precioUnitarioSnapshot: unitPrice
          };

          const detalleActualizado = await firstValueFrom(
            this.reciboDetalleService.updateDetalle(detalleDestino.id, payload)
          );
          const detalleBackend =
            await this.prepararDetalleActualizado(detalleActualizado);

          targetDetalles[existingTargetIndex] = {
            ...detalleDestino,
            ...detalleBackend,
            cantidad: payload.cantidad,
            subtotal: payload.subtotal,
            producto:
              detalleBackend.producto ??
              detalleDestino.producto ??
              detalle.producto
          };

          rollback = {
            type: 'restore-updated',
            detalleId: detalleDestino.id,
            payload: {
              reciboId: detalleDestino.reciboId,
              productoId: detalleDestino.productoId,
              cantidad: detalleDestino.cantidad,
              subtotal: detalleDestino.subtotal
            }
          };
        } else {
          const detalleCreado = await firstValueFrom(
            this.reciboDetalleService.createDetalle({
              reciboId: targetRelation.reciboId,
              productoId: detalle.productoId,
              presentacionId: detalle.presentacionId,
              cantidad: qtyToMove,
              subtotal: subtotalMove,
              precioUnitarioSnapshot: unitPrice
            })
          );

          targetDetalles = [
            ...targetDetalles,
            {
              ...detalleCreado,
              producto: detalleCreado.producto ?? detalle.producto
            }
          ];

          rollback = {
            type: 'delete-created',
            detalleId: detalleCreado.id
          };
        }

        try {
          if (qtyRemain <= 0) {
            await firstValueFrom(
              this.reciboDetalleService.deleteDetalle(detalle.id)
            );
            this.detalles = this.detalles.filter((d) => d.id !== detalle.id);
          } else {
            const sourcePayload: UpdateReciboDetalleRequest = {
              reciboId: detalle.reciboId,
              productoId: detalle.productoId,
              presentacionId: detalle.presentacionId,
              cantidad: qtyRemain,
              subtotal: subtotalRemain,
              precioUnitarioSnapshot: unitPrice
            };
            const sourceUpdated = await firstValueFrom(
              this.reciboDetalleService.updateDetalle(detalle.id, sourcePayload)
            );
            const sourceBackend =
              await this.prepararDetalleActualizado(sourceUpdated);
            this.detalles = this.detalles.map((d) =>
              d.id === detalle.id
                ? {
                    ...d,
                    ...sourceBackend,
                    cantidad: qtyRemain,
                    subtotal: subtotalRemain,
                    producto: sourceBackend.producto ?? d.producto
                  }
                : d
            );
          }
        } catch (sourceError) {
          await this.rollbackTargetDetalleChange(rollback);
          throw sourceError;
        }

        movedLinesCount += 1;
      }

      this.recalculateTotal();
      this.actualizarMostrarColumnaAtendido();

      const sourceTotal = this.calculateDetallesTotal(this.detalles);
      const targetTotal = this.calculateDetallesTotal(targetDetalles);

      const [sourceReciboActualizado] = await Promise.all([
        this.updateReciboTotal(this.recibo, sourceTotal),
        this.updateReciboTotal(targetRecibo, targetTotal)
      ]);

      this.recibo = {
        ...sourceReciboActualizado,
        total: sourceTotal,
        sesionId: this.sessionId ?? sourceReciboActualizado.sesionId
      };

      const nextIndex = this.detalles.length
        ? Math.min(this.selectedDetalleIndices[0], this.detalles.length - 1)
        : -1;

      this.setSelectedDetalles(
        nextIndex >= 0 ? [nextIndex] : [],
        nextIndex,
        false
      );
      this.focusSearchInputRequest.emit();

      this.snackBar.open('Productos movidos correctamente.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });

      return {
        sourceTicketId: this.ticket.id,
        targetTicketId,
        movedItemsCount: movedLinesCount,
        targetProductCount: targetDetalles.length
      };
    } catch (error) {
      console.error('Error moviendo productos entre tickets', error);
      this.snackBar.open(
        'No se pudieron mover los productos seleccionados.',
        'Cerrar',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
      return null;
    } finally {
      this.movingDetalles = false;
      this.updateSearchDisabled();
    }
  }

  private navigateDetalleUp(): void {
    if (this.detalles.length === 0) {
      return;
    }

    // Si estamos en el primer elemento, no hacer nada (no permitir wraparound)
    if (this.selectedDetalleIndex <= 0) {
      return;
    }

    // Ir al elemento anterior
    this.setSelectedDetalles(
      [this.selectedDetalleIndex - 1],
      this.selectedDetalleIndex - 1
    );
  }

  private navigateDetalleDown(): void {
    if (this.detalles.length === 0) {
      return;
    }

    // Si estamos en el último elemento, no hacer nada (no permitir wraparound)
    if (this.selectedDetalleIndex >= this.detalles.length - 1) {
      return;
    }

    // Ir al elemento siguiente
    this.setSelectedDetalles(
      [this.selectedDetalleIndex + 1],
      this.selectedDetalleIndex + 1
    );
  }

  private scrollToSelectedDetalle(): void {
    if (
      this.selectedDetalleIndex < 0 ||
      this.selectedDetalleIndex >= this.detalles.length
    ) {
      return;
    }

    const listEl = this.detalleListRef?.nativeElement;
    if (!listEl) {
      return;
    }

    // Esperar a que Angular actualice el DOM
    setTimeout(() => {
      const selectedRow = listEl.querySelector(
        `.detalle-row:nth-child(${this.selectedDetalleIndex + 1})`
      ) as HTMLElement;
      if (selectedRow) {
        const rowTop = selectedRow.offsetTop;
        const rowHeight = selectedRow.offsetHeight;
        const listTop = listEl.scrollTop;
        const listHeight = listEl.clientHeight;

        console.log('Scroll debug:', {
          selectedIndex: this.selectedDetalleIndex,
          rowTop,
          rowHeight,
          listTop,
          listHeight,
          rowBottom: rowTop + rowHeight,
          listBottom: listTop + listHeight
        });

        // Lógica de scroll natural: solo hacer scroll cuando sea realmente necesario
        const rowBottom = rowTop + rowHeight;
        const listBottom = listTop + listHeight;
        const middlePoint = listTop + listHeight / 2;

        console.log('Natural scroll analysis:', {
          rowTop,
          rowBottom,
          listTop,
          listBottom,
          middlePoint,
          isAbove: rowTop < listTop,
          isBelowMiddle: rowBottom > middlePoint,
          isFullyVisible: rowTop >= listTop && rowBottom <= listBottom
        });

        let needsScroll = false;
        let targetScrollTop = listTop;

        // Si el elemento está por encima de la vista visible, hacer scroll hacia arriba
        if (rowTop < listTop) {
          needsScroll = true;
          targetScrollTop = Math.max(0, rowTop - 20); // Pequeño margen arriba
          console.log('Element is above viewport, scrolling up');
        }
        // Si el elemento está por debajo de la mitad de la pantalla, hacer scroll hacia abajo
        else if (rowBottom > middlePoint) {
          needsScroll = true;
          targetScrollTop = rowBottom - listHeight + 20; // Dejar espacio abajo
          console.log('Element is below middle point, scrolling down');
        } else {
          console.log('Element is in good position, no scroll needed');
          return; // No hacer scroll si el elemento está bien posicionado
        }

        // Asegurar que el scroll no sea negativo ni exceda el máximo
        const maxScroll = listEl.scrollHeight - listEl.clientHeight;
        const clampedScrollTop = Math.max(
          0,
          Math.min(targetScrollTop, maxScroll)
        );

        console.log('Natural scroll to:', clampedScrollTop);
        listEl.scrollTop = clampedScrollTop;
      }
    }, 200); // Aumentado a 200ms para asegurar que el DOM esté completamente listo
  }

  onDetalleDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.estaEnEdicion) {
      return;
    }
    if (index < 0 || index >= this.detalles.length) {
      return;
    }
    const target = event.target as HTMLElement;
    const detalle = this.detalles[index];

    // Check if double-click was on "Valor unitario" field
    if (
      target.classList.contains('detalle-col') &&
      target.classList.contains('unitario')
    ) {
      this.onUnitarioDoubleClick(index, event);
      return;
    }

    // Check if double-click was on "Producto" field
    if (
      target.classList.contains('detalle-col') &&
      target.classList.contains('producto')
    ) {
      this.onProductoDoubleClick(index, event);
      return;
    }

    // Default: edit cantidad
    this.startingEdit = true;
    this.posFocus?.hold('edit:cantidad');
    this.editingDetalleIndex = index;
    this.editingCantidadCtrl.setValue(String(detalle.cantidad ?? 1));
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector(
        `.cantidad-input-${index}`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      // Restablecer startingEdit después de un corto tiempo
      setTimeout(() => {
        this.startingEdit = false;
      }, 50);
    }, 0);
  }

  onUnitarioDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.estaEnEdicion) {
      return;
    }
    if (index < 0 || index >= this.detalles.length) {
      return;
    }
    const detalle = this.detalles[index];
    if (!detalle.producto?.id) {
      return;
    }

    // Activar bandera de doble click
    this.isDoubleClickActive = true;
    this.startingEdit = true;
    this.posFocus?.hold('edit:unitario');

    const currentPrecio = this.getDetalleUnitario(detalle);
    this.editingUnitarioIndex = index;
    this.editingUnitarioCtrl.setValue(String(currentPrecio));

    setTimeout(() => {
      const input = document.querySelector(
        `.valor-unitario-input-${index}`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      setTimeout(() => {
        this.startingEdit = false;
        // Desactivar bandera después de un tiempo
        setTimeout(() => {
          this.isDoubleClickActive = false;
        }, 200);
      }, 50);
    }, 0);
  }

  onCantidadInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      // Use setTimeout to ensure the form control value is updated
      setTimeout(() => {
        this.saveCantidadEdit(index, true);
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

  saveCantidadEdit(index: number, focusSearch: boolean = false): void {
    if (
      this.editingDetalleIndex !== index ||
      index < 0 ||
      index >= this.detalles.length
    ) {
      this.cancelCantidadEdit();
      return;
    }

    const detalle = this.detalles[index];
    // Get value directly from the input element if possible, otherwise from form control
    const inputElement = document.querySelector(
      `.cantidad-input-${index}`
    ) as HTMLInputElement;
    const newCantidadStr =
      inputElement?.value?.trim() ||
      this.editingCantidadCtrl.value?.trim() ||
      '';
    const newCantidad = Number(newCantidadStr);

    if (isNaN(newCantidad) || newCantidad <= 0) {
      this.cancelCantidadEdit();
      return;
    }

    if (newCantidad === detalle.cantidad) {
      this.cancelCantidadEdit();
      return;
    }

    const unitPrice = this.getDetalleUnitario(detalle);

    if (
      !detalle.id ||
      unitPrice <= 0 ||
      !detalle.reciboId ||
      !detalle.productoId
    ) {
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
    this.posFocus?.release('edit:cantidad');

    const updatedList = [...this.detalles];
    updatedList[index] = optimisticDetalle;
    this.detalles = updatedList;
    const newTotal = this.recalculateTotal();
    if (focusSearch) {
      this.focusSearchInputRequest.emit();
    }

    this.reciboDetalleService.updateDetalle(detalle.id, payload).subscribe({
      next: async (updatedDetalle) => {
        const detalleBackend =
          await this.prepararDetalleActualizado(updatedDetalle);
        const updatedListFinal = [...this.detalles];
        const detalleActualizado = {
          ...optimisticDetalle,
          ...detalleBackend,
          cantidad: newCantidad,
          subtotal: newSubtotal,
          producto: detalleBackend.producto ?? detalle.producto
        };
        updatedListFinal[index] = detalleActualizado;
        this.detalles = updatedListFinal;
        this.depurarHistoricosExpandidos();
        const finalTotal = this.recalculateTotal();

        // Update recibo total on backend
        if (
          this.recibo &&
          this.recibo.id &&
          this.recibo.ticketId &&
          this.recibo.clienteId
        ) {
          // Calcular montoRecibido: si es efectivo, igual al total; si no, igual al total
          const montoRecibidoFinal =
            this.recibo.metodoPagoId === 1 ? finalTotal : finalTotal;

          this.reciboService
            .actualizarRecibo(this.recibo.id, {
              clienteId: this.clienteIdParaRecibo(),
              ticketId: this.recibo.ticketId,
              estadoId: this.recibo.estadoId ?? ESTADOS_RECIBO.PENDIENTE_PAGO,
              metodoPagoId: this.recibo.metodoPagoId ?? 0,
              total: String(finalTotal.toFixed(2)),
              sesionId: this.recibo.sesionId,
              montoRecibido: montoRecibidoFinal
            })
            .subscribe({
              next: (updatedRecibo) => {
                if (this.recibo) {
                  this.recibo = this.mergeActualizarReciboResponse(
                    this.recibo,
                    updatedRecibo
                  );
                }

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
    this.posFocus?.release('edit:cantidad');
  }

  onUnitarioInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      setTimeout(() => {
        this.saveUnitarioEdit(index, true);
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

  saveUnitarioEdit(index: number, focusSearch: boolean = false): void {
    if (
      this.editingUnitarioIndex !== index ||
      index < 0 ||
      index >= this.detalles.length
    ) {
      this.cancelUnitarioEdit();
      return;
    }

    const detalle = this.detalles[index];
    if (!detalle.producto?.id) {
      this.cancelUnitarioEdit();
      return;
    }

    const inputElement = document.querySelector(
      `.valor-unitario-input-${index}`
    ) as HTMLInputElement;
    const newPrecioStr =
      inputElement?.value?.trim() ||
      this.editingUnitarioCtrl.value?.trim() ||
      '';
    const newPrecio = Number(newPrecioStr);

    if (isNaN(newPrecio) || newPrecio <= 0) {
      this.cancelUnitarioEdit();
      return;
    }

    const currentPrecio = this.getDetalleUnitario(detalle);
    if (newPrecio === currentPrecio) {
      this.cancelUnitarioEdit();
      return;
    }

    // Clear editing state immediately
    this.editingUnitarioIndex = -1;
    this.editingUnitarioCtrl.setValue('');
    this.posFocus?.release('edit:unitario');

    // Update product via RelationalProductService
    const productUpdate: Producto = {
      ...detalle.producto,
      precio: newPrecio,
      foto: detalle.producto.foto ?? ''
    };

    this.relationalProductService
      .updateProduct(detalle.producto.id, productUpdate)
      .subscribe({
        next: (updatedProduct) => {
          // Find all detalles that use this product
          const detallesToUpdate = this.detalles.filter(
            (det) => det.productoId === updatedProduct.id
          );

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
              next: async (apiUpdatedDetalle: ReciboDetalleDto) => {
                const detalleBackend =
                  await this.prepararDetalleActualizado(apiUpdatedDetalle);
                const finalIndex = this.detalles.findIndex(
                  (d) => d.id === det.id
                );
                if (finalIndex >= 0) {
                  const finalList = [...this.detalles];
                  const newSubtotal = updatedProduct.precio * det.cantidad;
                  finalList[finalIndex] = {
                    ...detalleBackend,
                    subtotal: newSubtotal,
                    cantidad: det.cantidad,
                    producto: detalleBackend.producto
                      ? {
                          ...detalleBackend.producto,
                          precio: updatedProduct.precio
                        }
                      : {
                          ...det.producto!,
                          precio: updatedProduct.precio
                        }
                  };
                  this.detalles = finalList;
                  this.depurarHistoricosExpandidos();
                  this.recalculateTotal();
                }
              },
              error: (err) => {
                console.error(
                  'Error updating detalle after product price change',
                  err
                );
              }
            });
          });

          // Update recibo total on backend
          const finalTotal = this.recalculateTotal();
          if (
            this.recibo &&
            this.recibo.id &&
            this.recibo.ticketId &&
            this.recibo.clienteId
          ) {
            // Calcular montoRecibido: si es efectivo, igual al total; si no, igual al total
            const montoRecibidoFinal =
              this.recibo.metodoPagoId === 1 ? finalTotal : finalTotal;

            this.reciboService
              .actualizarRecibo(this.recibo.id, {
                clienteId: this.clienteIdParaRecibo(),
                ticketId: this.recibo.ticketId,
                estadoId: this.recibo.estadoId ?? ESTADOS_RECIBO.PENDIENTE_PAGO,
                metodoPagoId: this.recibo.metodoPagoId ?? 0,
                total: String(finalTotal.toFixed(2)),
                sesionId: this.recibo.sesionId,
                montoRecibido: montoRecibidoFinal
              })
              .subscribe({
                next: (updatedRecibo) => {
                  if (this.recibo) {
                    this.recibo = this.mergeActualizarReciboResponse(
                      this.recibo,
                      updatedRecibo
                    );
                  }

                  // Emitir evento para que el componente padre recargue los tickets
                  this.metodoPagoActualizado.emit();
                },
                error: (err) => {
                  console.error('Error updating recibo total', err);
                }
              });
          }
          if (focusSearch) {
            this.focusSearchInputRequest.emit();
          }
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
    this.posFocus?.release('edit:unitario');
  }

  onProductoDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.estaEnEdicion) {
      return;
    }
    if (index < 0 || index >= this.detalles.length) {
      return;
    }
    const detalle = this.detalles[index];
    if (!detalle.producto?.id || !detalle.producto?.nombre) {
      return;
    }

    // Activar bandera de doble click y bloqueo de focus
    this.isDoubleClickActive = true;
    this.blockFocusRequest = true;
    this.startingEdit = true;
    this.posFocus?.hold('edit:producto');

    this.editingProductoIndex = index;
    this.editingProductoCtrl.setValue(detalle.producto.nombre);

    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector(
        `.producto-input-${index}`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      setTimeout(() => {
        this.startingEdit = false;
        // Desactivar bandera después de un tiempo
        setTimeout(() => {
          this.isDoubleClickActive = false;
          this.blockFocusRequest = false;
        }, 300);
      }, 50);
    }, 0);
  }

  onCantidadDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.estaEnEdicion) {
      return;
    }
    if (index < 0 || index >= this.detalles.length) {
      return;
    }
    const detalle = this.detalles[index];

    // Activar bandera de doble click
    this.isDoubleClickActive = true;
    this.startingEdit = true;
    this.posFocus?.hold('edit:cantidad');

    this.editingDetalleIndex = index;
    this.editingCantidadCtrl.setValue(String(detalle.cantidad ?? 1));

    setTimeout(() => {
      const input = document.querySelector(
        `.cantidad-input-${index}`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      setTimeout(() => {
        this.startingEdit = false;
        // Desactivar bandera después de un tiempo
        setTimeout(() => {
          this.isDoubleClickActive = false;
        }, 200);
      }, 50);
    }, 0);
  }

  onProductoInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      setTimeout(() => {
        this.saveProductoEdit(index, true);
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

  saveProductoEdit(index: number, focusSearch: boolean = false): void {
    if (
      this.editingProductoIndex !== index ||
      index < 0 ||
      index >= this.detalles.length
    ) {
      this.cancelProductoEdit();
      return;
    }

    const detalle = this.detalles[index];
    if (!detalle.producto?.id) {
      this.cancelProductoEdit();
      return;
    }

    const inputElement = document.querySelector(
      `.producto-input-${index}`
    ) as HTMLInputElement;
    const newNombre = (
      inputElement?.value?.trim() ||
      this.editingProductoCtrl.value?.trim() ||
      ''
    ).trim();

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
    this.posFocus?.release('edit:producto');

    // Update product via RelationalProductService
    const productUpdate: Producto = {
      ...detalle.producto,
      nombre: newNombre,
      foto: detalle.producto.foto ?? ''
    };

    this.relationalProductService
      .updateProduct(detalle.producto.id, productUpdate)
      .subscribe({
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
          if (focusSearch) {
            this.focusSearchInputRequest.emit();
          }
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
    this.posFocus?.release('edit:producto');
  }

  deleteSelectedDetalle(): void {
    if (
      this.selectedDetalleIndex < 0 ||
      this.selectedDetalleIndex >= this.detalles.length
    ) {
      return;
    }
    const detalle = this.detalles[this.selectedDetalleIndex];
    this.reciboDetalleService.deleteDetalle(detalle.id).subscribe({
      next: () => {
        const updated = [...this.detalles];
        updated.splice(this.selectedDetalleIndex, 1);
        this.detalles = updated;
        this.recalculateTotal();
        const nextIndex =
          this.detalles.length === 0
            ? -1
            : Math.min(this.selectedDetalleIndex, this.detalles.length - 1);
        this.setSelectedDetalles(
          nextIndex >= 0 ? [nextIndex] : [],
          nextIndex,
          false
        );
        this.focusSearchInputRequest.emit();
      },
      error: (err: unknown) => {
        console.error('Error deleting detalle', err);
      }
    });
  }

  private incrementSelectedDetalleQuantity(): void {
    if (
      this.selectedDetalleIndex < 0 ||
      this.selectedDetalleIndex >= this.detalles.length
    ) {
      return;
    }

    const detalle = this.detalles[this.selectedDetalleIndex];
    const currentCantidad = Number(detalle.cantidad ?? 0);
    const unitPrice = this.getDetalleUnitario(detalle);

    if (
      !detalle.id ||
      unitPrice <= 0 ||
      !detalle.reciboId ||
      !detalle.productoId
    ) {
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
      next: async (updatedDetalle) => {
        const detalleBackend =
          await this.prepararDetalleActualizado(updatedDetalle);
        const updatedListFinal = [...this.detalles];
        const detalleActualizado = {
          ...optimisticDetalle,
          ...detalleBackend,
          cantidad: newCantidad,
          subtotal: newSubtotal
        };
        updatedListFinal[this.selectedDetalleIndex] = detalleActualizado;
        this.detalles = updatedListFinal;
        this.depurarHistoricosExpandidos();
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
    if (
      this.selectedDetalleIndex < 0 ||
      this.selectedDetalleIndex >= this.detalles.length
    ) {
      return;
    }

    const detalle = this.detalles[this.selectedDetalleIndex];
    const currentCantidad = Number(detalle.cantidad ?? 0);
    if (currentCantidad <= 1) {
      this.deleteSelectedDetalle();
      return;
    }

    const unitPrice = this.getDetalleUnitario(detalle);

    if (
      !detalle.id ||
      unitPrice <= 0 ||
      !detalle.reciboId ||
      !detalle.productoId
    ) {
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
      next: async (updatedDetalle) => {
        const detalleBackend =
          await this.prepararDetalleActualizado(updatedDetalle);
        const updatedListFinal = [...this.detalles];
        updatedListFinal[this.selectedDetalleIndex] = {
          ...optimisticDetalle,
          ...detalleBackend,
          cantidad: newCantidad,
          subtotal: newSubtotal,
          producto: detalleBackend.producto ?? detalle.producto
        };
        this.detalles = updatedListFinal;
        this.depurarHistoricosExpandidos();
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

  private openDetalleContextMenu(event: MouseEvent): void {
    this.availableTicketMoveOptions = [...this.ticketMoveOptions];
    this.contextMenuPosition = {
      x: event.clientX,
      y: event.clientY
    };

    this.cdr.detectChanges();
    setTimeout(() => this.detalleContextMenuTrigger?.openMenu(), 0);
  }

  private closeDetalleContextMenu(): void {
    this.detalleContextMenuTrigger?.closeMenu();
  }

  private setSelectedDetalles(
    indices: number[],
    preferredIndex: number | null = null,
    scrollToSelection: boolean = true
  ): void {
    const nextSelection = [...new Set(indices)]
      .filter((index) => index >= 0 && index < this.detalles.length)
      .sort((a, b) => a - b);

    this.selectedDetalleIndices = nextSelection;

    if (!nextSelection.length) {
      this.selectedDetalleIndex = -1;
      this.actualizarFooterSeleccion();
      return;
    }

    if (preferredIndex !== null && nextSelection.includes(preferredIndex)) {
      this.selectedDetalleIndex = preferredIndex;
    } else if (!nextSelection.includes(this.selectedDetalleIndex)) {
      this.selectedDetalleIndex = nextSelection[nextSelection.length - 1];
    }

    if (scrollToSelection) {
      this.scrollToSelectedDetalle();
    }

    this.actualizarFooterSeleccion();
  }

  private clienteIdParaRecibo(recibo: ReciboDto | null = this.recibo): number {
    const ticketClienteId = Number(this.ticket?.cliente?.id);
    if (Number.isFinite(ticketClienteId) && ticketClienteId !== CLIENTE_ANONIMO_ID) {
      return ticketClienteId;
    }
    const reciboClienteId = Number(recibo?.clienteId);
    if (Number.isFinite(reciboClienteId) && reciboClienteId > 0) {
      return reciboClienteId;
    }
    return CLIENTE_ANONIMO_ID;
  }

  private calculateDetallesTotal(detalles: ReciboDetalleDto[]): number {
    return detalles.reduce((acc, det) => acc + Number(det?.subtotal ?? 0), 0);
  }

  private async updateReciboTotal(
    recibo: ReciboDto,
    total: number
  ): Promise<ReciboDto> {
    const ticketId = recibo.ticketId ?? this.ticket?.id ?? null;
    if (!ticketId) {
      throw new Error('No se pudo determinar el ticket asociado al recibo.');
    }

    const resp = await firstValueFrom(
      this.reciboService.actualizarRecibo(recibo.id, {
        clienteId: this.clienteIdParaRecibo(recibo),
        ticketId,
        estadoId: recibo.estadoId ?? ESTADOS_RECIBO.PENDIENTE_PAGO,
        metodoPagoId: recibo.metodoPagoId ?? 0,
        total: total.toFixed(2),
        sesionId: this.sessionId ?? recibo.sesionId,
        montoRecibido: total
      })
    );
    return this.mergeActualizarReciboResponse(recibo, resp);
  }

  private async rollbackTargetDetalleChange(
    rollback: TargetDetalleRollback
  ): Promise<void> {
    try {
      if (rollback.type === 'delete-created') {
        await firstValueFrom(
          this.reciboDetalleService.deleteDetalle(rollback.detalleId)
        );
        return;
      }

      if (rollback.payload) {
        await firstValueFrom(
          this.reciboDetalleService.updateDetalle(
            rollback.detalleId,
            rollback.payload
          )
        );
      }
    } catch (rollbackError) {
      console.error(
        'No se pudo revertir el movimiento parcial del detalle',
        rollbackError
      );
    }
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
    if (this.modoCredito) {
      this.guiaCreditoSolicitada.emit();
      return;
    }
    this.seleccionarMetodoPago(metodo);
  }

  onIntentoPagoDeshabilitado(): void {
    if (this.modoCredito) {
      this.guiaCreditoSolicitada.emit();
    }
  }

  onFinalizarEdicion(): void {
    console.log('onFinalizarEdicion called in recibo component');
    console.log('recibo:', this.recibo);
    console.log('metodosPago length:', this.metodosPago.length);

    // Si el recibo ya tiene un método de pago seleccionado, usar ese
    if (this.recibo && this.recibo.metodoPagoId) {
      if (this.metodosPago.length > 0) {
        // Buscar el método de pago en la lista
        const metodo = this.metodosPago.find(
          (m) => m.id === this.recibo!.metodoPagoId
        );
        console.log('metodo encontrado:', metodo);
        if (metodo) {
          // Ejecutar el pago usando el método ya seleccionado,
          // omitiendo el diálogo de efectivo si aplica
          this.ejecutarPago(metodo, true);
        } else {
          console.error(
            'No se encontró el método de pago con id:',
            this.recibo.metodoPagoId
          );
        }
      } else {
        // Si los métodos de pago aún no se han cargado, esperar un momento
        console.log('Esperando a que se carguen los métodos de pago...');
        setTimeout(() => {
          const metodo = this.metodosPago.find(
            (m) => m.id === this.recibo!.metodoPagoId
          );
          if (metodo) {
            console.log('metodo encontrado después de esperar:', metodo);
            this.ejecutarPago(metodo, true);
          } else {
            console.error(
              'No se encontró el método de pago después de esperar'
            );
          }
        }, 500);
      }
    } else {
      console.warn(
        'El recibo no tiene un método de pago seleccionado. recibo:',
        this.recibo
      );
    }
  }

  private ejecutarPago(
    metodo: MetodoPagoDto,
    omitirDialogoEfectivo: boolean = false
  ): void {
    console.log('ejecutarPago called with:', {
      metodo,
      recibo: this.recibo,
      reciboId: this.reciboId,
      actualizandoMetodoPago: this.actualizandoMetodoPago
    });

    if (
      !metodo ||
      metodo.estado === 'inactivo' ||
      !this.recibo ||
      !this.reciboId ||
      this.actualizandoMetodoPago
    ) {
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

    const totalARegistrar = Number(this.recibo!.total ?? 0);

    if (metodo.id === 1 && !omitirDialogoEfectivo) {
      this.snapshotDetallesAntesDelPago();
      this.actualizandoMetodoPago = true;
      this.actividadUi.record('despliega modal: pago-efectivo-cambio (ejecutarPago)');
      this.posFocus?.hold('dialog:pago-efectivo');
      const dialogRef = this.dialog.open<
        PagoEfectivoCambioComponent,
        PagoEfectivoCambioData,
        PagoEfectivoCambioResultado
      >(PagoEfectivoCambioComponent, {
        width: '640px',
        data: {
          total: totalARegistrar,
          ejecutarPago: (confirmacion: PagoEfectivoConfirmacion) =>
            this.ejecutarPagoApi$(metodo, totalARegistrar, confirmacion),
          imprimirRecibo:
            this.recibo && this.detalles?.length
              ? (o) => this.imprimirRecibo(o)
              : undefined,
          mostrarSnackbarExito: (tg) =>
            this.mostrarSnackbarPagoExitosoSinImpresion(tg),
          registrarDatosImpresion: (d) => {
            this.ticketImpresionExtras = {
              metodoPagoLabel: this.labelImpresionDesdePagos(
                d.pagos,
                metodo.descripcion ?? 'EFECTIVO'
              ),
              montoRecibido: d.montoRecibido,
              cambio: d.cambio,
              pagosLineas: this.toPagosImpresion(d.pagos)
            };
          }
        },
        autoFocus: false,
        disableClose: true
      });
      dialogRef
        .afterClosed()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.actualizandoMetodoPago = false;
            this.posFocus?.releaseQuiet('dialog:pago-efectivo');
          })
        )
        .subscribe((resultado) => {
          if (resultado) {
            this.emitPaymentProcessedEvents();
            // Enfocar el input de búsqueda después de cerrar el modal
            setTimeout(() => this.focusSearchInputRequest.emit(), 200);
          }
        });
      return;
    }

    const debeImprimir = localStorage.getItem(IMPRIMIR_RECIBO_KEY) === 'true';
    this.snapshotDetallesAntesDelPago();

    const preProceso$: Observable<void> = of(void 0);

    this.actualizandoMetodoPago = true;

    preProceso$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.obtenerTicketAsociado()),
        switchMap((ticketId) => {
          const sesionId = this.getSessionId();
          // Calcular montoRecibido: si es efectivo, igual al total (se pasará desde el modal); si no, igual al total
          const montoRecibidoFinal =
            metodo.id === 1 ? totalARegistrar : totalARegistrar;

          const payload: ActualizarReciboRequest = {
            clienteId: this.clienteIdParaRecibo(),
            ticketId,
            estadoId: ESTADOS_RECIBO.PAGADO,
            metodoPagoId: metodo.id,
            total: totalARegistrar.toFixed(2),
            sesionId: sesionId ?? undefined,
            montoRecibido: montoRecibidoFinal,
            pagos: [{ metodoPagoId: metodo.id, monto: totalARegistrar }]
          };

          return this.reciboService
            .actualizarRecibo(this.recibo!.id, payload)
            .pipe(
              tap((resp) => this.capturarConsecutivoDocumentoVenta(resp)),
              switchMap(() => {
                const sessionId = this.getSessionId();
                if (!sessionId) {
                  throw new Error('No se encontró sessionId.');
                }
                return this.ticketReciboService
                  .getByTicketId(ticketId, sessionId)
                  .pipe(
                    map((relacion) => {
                      if (!relacion?.reciboId) {
                        throw new Error(
                          'No se encontró relación recibo para este ticket.'
                        );
                      }
                      return {
                        reciboId: relacion.reciboId,
                        totalGuardado: totalARegistrar
                      };
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
                      console.error(
                        'Error recargando tickets después de actualizar recibo',
                        err
                      );
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
          // Si debe imprimir, hacerlo automáticamente sin mostrar snackbar
          if (debeImprimir) {
            console.log(
              'Pago exitoso (método no efectivo - ejecutarPago), imprimiendo automáticamente...'
            );
            this.aplicarExtrasImpresionMetodoDirecto(metodo, totalARegistrar);
            this.cacheRecentReciboForReprint();
            this.emitPaymentProcessedEvents();
            setTimeout(() => {
              this.imprimirRecibo();
            }, 300);
          } else {
            this.aplicarExtrasImpresionMetodoDirecto(metodo, totalARegistrar);
            this.mostrarSnackbarPagoExitoso(totalGuardado);
            // Enfocar el input de búsqueda después del pago cuando no se imprime
            // Usamos un delay más largo para asegurar que el snackbar se haya mostrado completamente
            console.log(
              'Pago exitoso sin impresión, restaurando focus al input de búsqueda...'
            );
            setTimeout(() => {
              console.log('Emitiendo evento focusSearchInputRequest...');
              this.focusSearchInputRequest.emit();
            }, 500);
          }
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
            const snackBarElement = document.querySelector(
              '.recibo-snackbar-error .mat-mdc-snack-bar-label'
            );
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(
                  currencyRegex,
                  `<strong>${match[0]}</strong>`
                );
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);
        }
      });
  }

  onMetodoPagoSeleccionadoDesdeEdicion(event: {
    metodo: MetodoPagoDto;
    valorReferencia: number | null;
  }): void {
    // Cuando se selecciona un método de pago desde el componente de edición,
    // usar valorReferencia (diferencia) para el diálogo, pero procesar el total completo
    const metodo = event.metodo;
    const valorReferencia = event.valorReferencia;

    if (
      !metodo ||
      metodo.estado === 'inactivo' ||
      !this.recibo ||
      !this.reciboId ||
      this.actualizandoMetodoPago
    ) {
      return;
    }

    // Obtener el total del recibo completo para el PUT
    const totalARegistrar = Number(this.recibo!.total ?? 0);
    // Usar valorReferencia (diferencia) para el diálogo de pago en efectivo
    const valorParaDialogo =
      valorReferencia !== null && valorReferencia > 0
        ? valorReferencia
        : totalARegistrar;

    if (metodo.id === 1) {
      this.snapshotDetallesAntesDelPago();
      this.actualizandoMetodoPago = true;
      this.actividadUi.record(
        'despliega modal: pago-efectivo-cambio (método pago desde edición ticket)'
      );
      this.posFocus?.hold('dialog:pago-efectivo');
      const dialogRef = this.dialog.open<
        PagoEfectivoCambioComponent,
        PagoEfectivoCambioData,
        PagoEfectivoCambioResultado
      >(PagoEfectivoCambioComponent, {
        width: '640px',
        data: {
          total: valorParaDialogo,
          ejecutarPago: (confirmacion: PagoEfectivoConfirmacion) =>
            this.ejecutarPagoApi$(metodo, totalARegistrar, confirmacion),
          imprimirRecibo:
            this.recibo && this.detalles?.length
              ? (o) => this.imprimirRecibo(o)
              : undefined,
          mostrarSnackbarExito: (tg) =>
            this.mostrarSnackbarPagoExitosoSinImpresion(tg),
          registrarDatosImpresion: (d) => {
            this.ticketImpresionExtras = {
              metodoPagoLabel: this.labelImpresionDesdePagos(
                d.pagos,
                metodo.descripcion ?? 'EFECTIVO'
              ),
              montoRecibido: d.montoRecibido,
              cambio: d.cambio,
              pagosLineas: this.toPagosImpresion(d.pagos)
            };
          }
        },
        autoFocus: false,
        disableClose: true
      });
      dialogRef
        .afterClosed()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.actualizandoMetodoPago = false;
            this.posFocus?.releaseQuiet('dialog:pago-efectivo');
          })
        )
        .subscribe((resultado) => {
          if (resultado) {
            this.emitPaymentProcessedEvents();
            // Enfocar el input de búsqueda después de cerrar el modal
            setTimeout(() => this.focusSearchInputRequest.emit(), 200);
          }
        });
      return;
    }

    const debeImprimir = localStorage.getItem(IMPRIMIR_RECIBO_KEY) === 'true';
    this.snapshotDetallesAntesDelPago();

    const preProceso$: Observable<void> = of(void 0);

    this.actualizandoMetodoPago = true;

    preProceso$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.obtenerTicketAsociado()),
        switchMap((ticketId) => {
          const sesionId = this.getSessionId();
          // Calcular montoRecibido: si es efectivo, igual al total (se pasará desde el modal); si no, igual al total
          const montoRecibidoFinal =
            metodo.id === 1 ? totalARegistrar : totalARegistrar;

          const payload: ActualizarReciboRequest = {
            clienteId: this.clienteIdParaRecibo(),
            ticketId,
            estadoId: ESTADOS_RECIBO.PAGADO,
            metodoPagoId: metodo.id,
            total: totalARegistrar.toFixed(2),
            sesionId: sesionId ?? undefined,
            montoRecibido: montoRecibidoFinal,
            pagos: [{ metodoPagoId: metodo.id, monto: totalARegistrar }]
          };

          return this.reciboService
            .actualizarRecibo(this.recibo!.id, payload)
            .pipe(
              tap((resp) => this.capturarConsecutivoDocumentoVenta(resp)),
              switchMap(() => {
                const sessionId = this.getSessionId();
                if (!sessionId) {
                  throw new Error('No se encontró sessionId.');
                }
                return this.ticketReciboService
                  .getByTicketId(ticketId, sessionId)
                  .pipe(
                    map((relacion) => {
                      if (!relacion?.reciboId) {
                        throw new Error(
                          'No se encontró relación recibo para este ticket.'
                        );
                      }
                      return {
                        reciboId: relacion.reciboId,
                        totalGuardado: totalARegistrar
                      };
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
                      console.error(
                        'Error recargando tickets después de actualizar recibo',
                        err
                      );
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
          // Si debe imprimir, hacerlo automáticamente sin mostrar snackbar
          if (debeImprimir) {
            console.log(
              'Pago exitoso (método no efectivo - onMetodoPagoSeleccionadoDesdeEdicion), imprimiendo automáticamente...'
            );
            this.aplicarExtrasImpresionMetodoDirecto(metodo, totalARegistrar);
            this.cacheRecentReciboForReprint();
            this.emitPaymentProcessedEvents();
            setTimeout(() => {
              this.imprimirRecibo();
            }, 300);
          } else {
            this.aplicarExtrasImpresionMetodoDirecto(metodo, totalARegistrar);
            this.mostrarSnackbarPagoExitoso(totalGuardado);
            // Enfocar el input de búsqueda después del pago cuando no se imprime
            // Usamos un delay más largo para asegurar que el snackbar se haya mostrado completamente
            console.log(
              'Pago exitoso sin impresión, restaurando focus al input de búsqueda...'
            );
            setTimeout(() => {
              console.log('Emitiendo evento focusSearchInputRequest...');
              this.focusSearchInputRequest.emit();
            }, 500);
          }
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
            const snackBarElement = document.querySelector(
              '.recibo-snackbar-error .mat-mdc-snack-bar-label'
            );
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(
                  currencyRegex,
                  `<strong>${match[0]}</strong>`
                );
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
      .obtenerMetodosPagoParaTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) =>
          (this.metodosPago = (metodos ?? [])
            .slice()
            .sort((a, b) => a.id - b.id)),
        error: (err) => console.error('Error cargando métodos de pago', err)
      });
  }

  formatCurrency(value: number | null | undefined): string {
    const numericValue = Number(value ?? 0);
    const formatted = this.currencyFormatter.format(numericValue);
    return formatted.replace('COP', '$').trim();
  }

  /** Sincroniza el pie global con la suma de subtotales de la multiselección. */
  private actualizarFooterSeleccion(): void {
    if (this.selectedDetalleIndices.length < 2) {
      this.footerService.clearFooterItems();
      return;
    }
    const sum = this.selectedDetalleIndices.reduce((acc, idx) => {
      const det = this.detalles[idx];
      return acc + Number(det?.subtotal ?? 0);
    }, 0);
    const count = this.selectedDetalleIndices.length;
    this.footerService.setFooterItems(
      [
        {
          textoClave: 'Selección',
          valorClave: this.formatCurrency(sum),
          estiloCssClave: ''
        },
        {
          textoClave: 'Items seleccionados',
          valorClave: String(count),
          estiloCssClave: ''
        }
      ],
      { itemsFlow: 'rtl' }
    );
  }

  /** Formatea una fecha ISO (e.g. "2026-02-11T21:00:48") a formato legible con hora. */
  formatFechaCreacion(fechaIso: string | null | undefined): string {
    if (!fechaIso) {
      return '';
    }
    try {
      const date = new Date(fechaIso);
      return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return fechaIso;
    }
  }

  seleccionarMetodoPago(metodo: MetodoPagoDto): void {
    if (
      !metodo ||
      metodo.estado === 'inactivo' ||
      !this.recibo ||
      !this.reciboId ||
      this.actualizandoMetodoPago
    ) {
      return;
    }

    if (this.recibo.metodoPagoId === metodo.id) {
      return;
    }

    const totalARegistrar = Number(this.recibo!.total ?? 0);

    if (metodo.id === 1) {
      this.snapshotDetallesAntesDelPago();
      this.actualizandoMetodoPago = true;
      this.actividadUi.record(
        'despliega modal: pago-efectivo-cambio (seleccionar método pago en barra)'
      );
      this.posFocus?.hold('dialog:pago-efectivo');
      const dialogRef = this.dialog.open<
        PagoEfectivoCambioComponent,
        PagoEfectivoCambioData,
        PagoEfectivoCambioResultado
      >(PagoEfectivoCambioComponent, {
        width: '640px',
        data: {
          total: totalARegistrar,
          ejecutarPago: (confirmacion: PagoEfectivoConfirmacion) =>
            this.ejecutarPagoApi$(metodo, totalARegistrar, confirmacion),
          imprimirRecibo:
            this.recibo && this.detalles?.length
              ? (o) => this.imprimirRecibo(o)
              : undefined,
          mostrarSnackbarExito: (tg) =>
            this.mostrarSnackbarPagoExitosoSinImpresion(tg),
          registrarDatosImpresion: (d) => {
            this.ticketImpresionExtras = {
              metodoPagoLabel: this.labelImpresionDesdePagos(
                d.pagos,
                metodo.descripcion ?? 'EFECTIVO'
              ),
              montoRecibido: d.montoRecibido,
              cambio: d.cambio,
              pagosLineas: this.toPagosImpresion(d.pagos)
            };
          }
        },
        autoFocus: false,
        disableClose: true
      });
      dialogRef
        .afterClosed()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.actualizandoMetodoPago = false;
            this.posFocus?.releaseQuiet('dialog:pago-efectivo');
          })
        )
        .subscribe((resultado) => {
          if (resultado) {
            this.emitPaymentProcessedEvents();
            // Enfocar el input de búsqueda después de cerrar el modal
            setTimeout(() => this.focusSearchInputRequest.emit(), 200);
          }
        });
      return;
    }

    const debeImprimir = localStorage.getItem(IMPRIMIR_RECIBO_KEY) === 'true';
    this.snapshotDetallesAntesDelPago();

    const preProceso$: Observable<void> = of(void 0);

    this.actualizandoMetodoPago = true;

    preProceso$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.obtenerTicketAsociado()),
        switchMap((ticketId) => {
          const sesionId = this.getSessionId();
          // Calcular montoRecibido: si es efectivo, igual al total (se pasará desde el modal); si no, igual al total
          const montoRecibidoFinal =
            metodo.id === 1 ? totalARegistrar : totalARegistrar;

          const payload: ActualizarReciboRequest = {
            clienteId: this.clienteIdParaRecibo(),
            ticketId,
            estadoId: ESTADOS_RECIBO.PAGADO,
            metodoPagoId: metodo.id,
            total: totalARegistrar.toFixed(2),
            sesionId: sesionId ?? undefined,
            montoRecibido: montoRecibidoFinal,
            pagos: [{ metodoPagoId: metodo.id, monto: totalARegistrar }]
          };

          return this.reciboService
            .actualizarRecibo(this.recibo!.id, payload)
            .pipe(
              tap((resp) => this.capturarConsecutivoDocumentoVenta(resp)),
              switchMap(() => {
                const sessionId = this.getSessionId();
                if (!sessionId) {
                  throw new Error('No se encontró sessionId.');
                }
                return this.ticketReciboService
                  .getByTicketId(ticketId, sessionId)
                  .pipe(
                    map((relacion) => {
                      if (!relacion?.reciboId) {
                        throw new Error(
                          'No se encontró relación recibo para este ticket.'
                        );
                      }
                      return {
                        reciboId: relacion.reciboId,
                        totalGuardado: totalARegistrar
                      };
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
                      console.error(
                        'Error recargando tickets después de actualizar recibo',
                        err
                      );
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
          // Si debe imprimir, hacerlo automáticamente sin mostrar snackbar
          if (debeImprimir) {
            console.log(
              'Pago exitoso (método no efectivo - seleccionarMetodoPago), imprimiendo automáticamente...'
            );
            this.aplicarExtrasImpresionMetodoDirecto(metodo, totalARegistrar);
            this.cacheRecentReciboForReprint();
            this.emitPaymentProcessedEvents();
            setTimeout(() => {
              this.imprimirRecibo();
            }, 300);
          } else {
            this.aplicarExtrasImpresionMetodoDirecto(metodo, totalARegistrar);
            this.mostrarSnackbarPagoExitoso(totalGuardado);
            // Enfocar el input de búsqueda después del pago cuando no se imprime
            // Usamos un delay más largo para asegurar que el snackbar se haya mostrado completamente
            console.log(
              'Pago exitoso sin impresión, restaurando focus al input de búsqueda...'
            );
            setTimeout(() => {
              console.log('Emitiendo evento focusSearchInputRequest...');
              this.focusSearchInputRequest.emit();
            }, 500);
          }
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
            const snackBarElement = document.querySelector(
              '.recibo-snackbar-error .mat-mdc-snack-bar-label'
            );
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(
                  currencyRegex,
                  `<strong>${match[0]}</strong>`
                );
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
      return throwError(
        () => new Error('Recibo no válido para determinar ticket.')
      );
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

  /**
   * Ejecuta la API de pago (actualizar recibo, recargar tickets). Usado por el modal de efectivo.
   */
  private ejecutarPagoApi$(
    metodo: MetodoPagoDto,
    totalARegistrar: number,
    confirmacion?: PagoEfectivoConfirmacion | number
  ): Observable<number> {
    return this.obtenerTicketAsociado().pipe(
      switchMap((ticketId) => {
        const sesionId = this.getSessionId();
        const { montoRecibidoFinal, pagos } = this.resolverConfirmacionPago(
          metodo,
          totalARegistrar,
          confirmacion
        );

        const payload: ActualizarReciboRequest = {
          clienteId: this.clienteIdParaRecibo(),
          ticketId,
          estadoId: ESTADOS_RECIBO.PAGADO,
          metodoPagoId: metodo.id,
          total: totalARegistrar.toFixed(2),
          sesionId: sesionId ?? undefined,
          montoRecibido: montoRecibidoFinal,
          pagos
        };
        return this.reciboService
          .actualizarRecibo(this.recibo!.id, payload)
          .pipe(
            tap((resp) => this.capturarConsecutivoDocumentoVenta(resp)),
            switchMap(() => {
              const sessionId = this.getSessionId();
              if (!sessionId) throw new Error('No se encontró sessionId.');
              return this.ticketReciboService
                .getByTicketId(ticketId, sessionId)
                .pipe(
                  map((relacion) => {
                    if (!relacion?.reciboId)
                      throw new Error(
                        'No se encontró relación recibo para este ticket.'
                      );
                    return {
                      reciboId: relacion.reciboId,
                      totalGuardado: totalARegistrar
                    };
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
            const sessionId = this.getSessionId();
            if (sessionId) {
              return this.ticketsService.getTicketsBySession(sessionId).pipe(
                takeUntil(this.destroy$),
                map(() => totalGuardado),
                tap({
                  error: (err) =>
                    console.error(
                      'Error recargando tickets después de actualizar recibo',
                      err
                    )
                })
              );
            }
            return of(totalGuardado);
          })
        )
      )
    );
  }

  private resolverConfirmacionPago(
    metodo: MetodoPagoDto,
    totalARegistrar: number,
    confirmacion?: PagoEfectivoConfirmacion | number
  ): { montoRecibidoFinal: number; pagos: ReciboPagoLinea[] } {
    if (confirmacion != null && typeof confirmacion === 'object') {
      return {
        montoRecibidoFinal: confirmacion.montoRecibido,
        pagos: confirmacion.pagos.map((p) => ({
          metodoPagoId: p.metodoPagoId,
          monto: p.monto
        }))
      };
    }
    const montoRecibidoFinal =
      metodo.id === 1 && typeof confirmacion === 'number'
        ? confirmacion
        : totalARegistrar;
    return {
      montoRecibidoFinal,
      pagos: [{ metodoPagoId: metodo.id, monto: totalARegistrar }]
    };
  }

  private toPagosImpresion(
    pagos?: ReciboPagoLinea[] | null
  ): ReciboPagoImpresionLinea[] | null {
    if (!pagos?.length) {
      return null;
    }
    return pagos.map((p) => ({
      metodoPagoId: p.metodoPagoId,
      label: this.nombreMetodoPago(p.metodoPagoId),
      monto: Number(p.monto)
    }));
  }

  private labelImpresionDesdePagos(
    pagos: ReciboPagoLinea[] | undefined,
    fallback: string
  ): string {
    if (!pagos?.length) {
      return fallback;
    }
    if (pagos.length === 1) {
      return this.nombreMetodoPago(pagos[0].metodoPagoId);
    }
    return 'MIXTO';
  }

  private nombreMetodoPago(metodoPagoId: number): string {
    const m = this.metodosPago?.find((x) => x.id === metodoPagoId);
    return (m?.descripcion ?? `Medio ${metodoPagoId}`).trim();
  }

  /**
   * Muestra solo el snackbar de pago exitoso (sin lógica de impresión). Usado cuando el modal de efectivo
   * maneja la impresión internamente.
   */
  private mostrarSnackbarPagoExitosoSinImpresion(totalGuardado: number): void {
    this.cacheRecentReciboForReprint();
    const totalFormateado = this.formatCurrency(totalGuardado);
    this.snackBar.open(
      `Recibo por valor de ${totalFormateado} guardado correctamente`,
      undefined,
      {
        duration: 5000,
        horizontalPosition: 'right',
        panelClass: ['recibo-snackbar-success']
      }
    );
    setTimeout(() => {
      const snackBarElement = document.querySelector(
        '.recibo-snackbar-success .mat-mdc-snack-bar-label'
      );
      if (snackBarElement) {
        const text = snackBarElement.textContent || '';
        const currencyRegex = /\$\s*[\d.,]+/;
        const match = text.match(currencyRegex);
        if (match) {
          const boldText = text.replace(
            currencyRegex,
            `<strong>${match[0]}</strong>`
          );
          snackBarElement.innerHTML = boldText;
        }
      }
    }, 0);
    this.emitPaymentProcessedEvents();
    // Enfocar el input de búsqueda después del pago
    setTimeout(() => this.focusSearchInputRequest.emit(), 300);
  }

  /**
   * Muestra el snackbar de pago exitoso. Si "imprimir recibo al pagar" está activo,
   * inyecta el recibo en el DOM y muestra el botón "Imprimir" en el snackbar. La impresión
   * se dispara al hacer clic en "Imprimir" (gesto directo del usuario) para evitar bloqueos del navegador.
   */
  private mostrarSnackbarPagoExitoso(totalGuardado: number): void {
    this.cacheRecentReciboForReprint();
    const totalFormateado = this.formatCurrency(totalGuardado);
    const quiereImprimir =
      localStorage.getItem(IMPRIMIR_RECIBO_KEY) === 'true' &&
      this.recibo &&
      this.detalles?.length;
    let limpiarRecibo: (() => void) | null = null;
    if (quiereImprimir && this.recibo && this.detalles?.length) {
      limpiarRecibo = this.prepararReciboParaImpresion(
        this.recibo,
        this.detalles
      );
    }
    const config = {
      duration: 8000,
      horizontalPosition: 'right' as const,
      panelClass: ['recibo-snackbar-success']
    };
    const snackRef = this.snackBar.open(
      `Recibo por valor de ${totalFormateado} guardado correctamente`,
      quiereImprimir ? 'Imprimir' : undefined,
      config
    );
    if (quiereImprimir && limpiarRecibo) {
      snackRef.onAction().subscribe(() => {
        window.print();
        const prevAfterPrint = window.onafterprint;
        const cleanup = () => {
          limpiarRecibo?.();
          window.onafterprint = prevAfterPrint ?? null;
        };
        window.onafterprint = cleanup;
        setTimeout(cleanup, 4000);
      });
      snackRef.afterDismissed().subscribe(() => limpiarRecibo?.());
    }
    setTimeout(() => {
      const snackBarElement = document.querySelector(
        '.recibo-snackbar-success .mat-mdc-snack-bar-label'
      );
      if (snackBarElement) {
        const text = snackBarElement.textContent || '';
        const currencyRegex = /\$\s*[\d.,]+/;
        const match = text.match(currencyRegex);
        if (match) {
          const boldText = text.replace(
            currencyRegex,
            `<strong>${match[0]}</strong>`
          );
          snackBarElement.innerHTML = boldText;
        }
      }
    }, 0);
    this.emitPaymentProcessedEvents();
  }

  /**
   * Inyecta el recibo en la ventana actual (oculto en pantalla, visible al imprimir).
   * Devuelve una función para limpiar el DOM. La impresión se dispara desde el clic en "Imprimir" del snackbar.
   */
  private prepararReciboParaImpresion(
    recibo: ReciboDto,
    detalles: ReciboDetalleDto[]
  ): () => void {
    const idRoot = 'recibo-pos-print-root';
    const idStyles = 'recibo-pos-print-styles';
    const contenido = this.reciboPrintService.buildReciboHtmlFromOpciones(
      this.opcionesImpresionRecibo(detalles, new Date())
    );

    const styleEl = document.createElement('style');
    styleEl.id = idStyles;
    styleEl.textContent = ReciboPrintService.injectedPrintCss(idRoot);

    const wrap = document.createElement('div');
    wrap.id = idRoot;
    wrap.innerHTML = contenido;
    document.body.appendChild(styleEl);
    document.body.appendChild(wrap);

    return () => {
      const s = document.getElementById(idStyles);
      const r = document.getElementById(idRoot);
      if (s?.parentNode) s.parentNode.removeChild(s);
      if (r?.parentNode) r.parentNode.removeChild(r);
    };
  }

  /**
   * Imprime el ticket abierto con bloque de crédito (CxC).
   * Ignora la preferencia «Imprimir ticket luego de pagar».
   */
  imprimirTicketConCredito(resumen: {
    creditoOriginal?: number;
    abonado: number;
    saldoPendiente: number;
    nota?: string | null;
  }): void {
    const prevExtras = this.ticketImpresionExtras;
    this.ticketImpresionExtras = {
      ...(prevExtras ?? {}),
      creditoResumen: {
        abonado: resumen.abonado,
        saldoPendiente: resumen.saldoPendiente,
        nota:
          resumen.nota?.trim() ||
          'Tiene crédito pendiente por pagar.'
      }
    };
    try {
      this.imprimirRecibo({ omitirPreferenciaGlobal: true });
    } finally {
      this.ticketImpresionExtras = prevExtras;
    }
  }

  /**
   * Imprime el recibo actual usando window.open() como en el ejemplo funcional.
   * Por defecto respeta `IMPRIMIR_RECIBO_KEY`; el modal de efectivo puede pasar
   * `omitirPreferenciaGlobal` para imprimir solo ese ticket sin cambiar la clave.
   */
  imprimirRecibo(opciones?: ImprimirReciboTrasPagoOpciones): void {
    console.log('=== IMPRIMIR RECIBO LLAMADO ===');
    console.log(
      'localStorage imprimir-recibo:',
      localStorage.getItem(IMPRIMIR_RECIBO_KEY)
    );

    const debeImprimir =
      opciones?.omitirPreferenciaGlobal === true ||
      localStorage.getItem(IMPRIMIR_RECIBO_KEY) === 'true';

    if (!debeImprimir) {
      console.log('Impresión deshabilitada: imprimir-recibo no está en true');
      return;
    }

    if (!this.recibo) {
      console.log('No hay recibo para imprimir');
      return;
    }

    // Usar detalles guardados antes del pago si están disponibles
    if (this.detallesParaImprimir?.length > 0) {
      console.log(
        'Usando detalles guardados antes del pago:',
        this.detallesParaImprimir.length
      );
      const detallesTemporales = [...this.detallesParaImprimir];
      this.detallesParaImprimir = []; // Limpiar después de usar
      this.ejecutarImpresionConDetalles(detallesTemporales);
      return;
    }

    // Si no hay detalles pero hay recibo, recargar los detalles primero
    if (!this.detalles?.length && this.recibo.id) {
      console.log('Detalles vacíos, recargando detalles del recibo...', {
        reciboId: this.recibo.id
      });
      this.reciboDetalleService.getDetallesByRecibo(this.recibo.id).subscribe({
        next: (detalles) => {
          console.log('Detalles cargados:', detalles?.length);
          this.detalles = detalles || [];
          if (this.detalles.length > 0) {
            // Intentar imprimir de nuevo con los detalles cargados
            setTimeout(() => this.ejecutarImpresion(), 100);
          } else {
            console.log('No hay detalles para imprimir después de recargar');
          }
        },
        error: (err) => {
          console.error('Error cargando detalles para imprimir', err);
        }
      });
      return;
    }

    if (!this.detalles?.length) {
      console.log('No hay detalles para imprimir', {
        detalles: this.detalles?.length
      });
      return;
    }

    this.ejecutarImpresion();
  }

  private ejecutarImpresion(): void {
    this.ejecutarImpresionConDetalles(this.detalles);
  }

  private ejecutarImpresionConDetalles(detalles: ReciboDetalleDto[]): void {
    console.log('Generando impresión del recibo...', {
      detalles: detalles?.length
    });
    if (this.recibo?.id && detalles?.length) {
      this.reciboPrintService.registerRecentRecibo(
        this.recibo,
        this.reciboPrintService.toPrintableDetalles(detalles),
        this.ticket?.cliente?.nombre,
        this.ticketImpresionExtras
      );
    }
    const printed = this.reciboPrintService.printRecibo(
      this.opcionesImpresionRecibo(detalles)
    );

    if (!printed) {
      console.error(
        'No se pudo abrir la ventana de impresión - ventanas emergentes bloqueadas'
      );
      alert('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    // Enfocar el input de búsqueda después de que la ventana de impresión se cierre
    // Usamos un delay más largo para asegurar que la ventana de impresión se haya cerrado completamente
    // La ventana se cierra en window.onafterprint después de 100ms, así que esperamos un poco más
    setTimeout(() => this.focusSearchInputRequest.emit(), 1500);
  }

  /**
   * Abre el recibo actual en nueva pestaña. Se llama desde el menú Opciones (Descargar recibo).
   */
  descargarReciboActual(): boolean {
    if (!this.recibo || !this.detalles?.length) return false;
    try {
      this.abrirReciboEnNuevaPestana(this.recibo, this.detalles);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Genera el HTML del recibo y lo abre en nueva pestaña (para menú Descargar recibo).
   */
  private abrirReciboEnNuevaPestana(
    recibo: ReciboDto,
    detalles: ReciboDetalleDto[]
  ): void {
    const cuerpo = this.reciboPrintService.buildReciboHtmlFromOpciones({
      detalles: this.reciboPrintService.toPrintableDetalles(detalles),
      fechaCreacion: recibo.fechaCreacion,
      clienteNombre: recibo.cliente?.nombre ?? this.ticket?.cliente?.nombre,
      establecimiento: ReciboPrintService.toImpresionEstablecimiento(
        this.establecimientoService.getSnapshot()
      ),
      documentoVentaConsecutivo: this.documentoVentaConsecutivoPago,
      ...this.ticketImpresionExtras
    });
    const htmlCompleto = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo</title>
<style>${ReciboPrintService.standalonePrintCss()}</style></head><body>${cuerpo}</body></html>`;
    const dataUri =
      'data:text/html;charset=utf-8,' + encodeURIComponent(htmlCompleto);
    const link = document.createElement('a');
    link.href = dataUri;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
