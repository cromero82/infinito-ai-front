import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ApplicationRef,
  inject,
  HostListener
} from '@angular/core';
import { Router } from '@angular/router';
import { MatTabsModule, MatTabNav } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';
import {
  DetalleTicketComponent,
  TicketMoveOption
} from '../detalle-ticket/detalle-ticket.component';
import { ConfirmacionPagosPanelComponent } from '../confirmacion-pagos-panel/confirmacion-pagos-panel.component';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import {
  TicketsService,
  TicketDto,
  TicketOrdenDto
} from '../service/tickets.service';
import { TicketReciboService } from '../service/ticket-recibo.service';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import { SesionesService, SesionDto } from '../service/sesiones.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  TicketRapidoComponent,
  TicketRapidoData
} from '../ticket-rapido/ticket-rapido.component';
import {
  EditarTabTicketComponent,
  EditarTabTicketData,
  EditarTabTicketResult
} from '../editar-tab-ticket/editar-tab-ticket.component';
import {
  AbrirCuentaPorCobrarDialogComponent,
  AbrirCuentaPorCobrarDialogData
} from '../abrir-cuenta-por-cobrar-dialog/abrir-cuenta-por-cobrar-dialog.component';
import {
  TicketObservacionDialogComponent,
  TicketObservacionDialogData
} from '../ticket-observacion-dialog/ticket-observacion-dialog.component';
import {
  CuentaPorCobrarDto,
  CuentaPorCobrarService
} from '../service/cuenta-por-cobrar.service';
import { PendienteConfirmacionDto } from '../service/confirmacion-pago.service';
import { CxcTicketRailComponent } from '../cxc-ticket-rail/cxc-ticket-rail.component';
import {
  RegistrarAbonoCxcDialogComponent,
  RegistrarAbonoCxcDialogData,
  RegistrarAbonoCxcDialogResult
} from '../registrar-abono-cxc-dialog/registrar-abono-cxc-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import { ReciboDetalleService } from '../service/recibo-detalle.service';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';
import {
  RecentPrintedReciboItem,
  ReciboPrintService
} from '../service/recibo-print.service';
import { EstablecimientoService } from '../service/establecimiento.service';
import {
  IMPRIMIR_RECIBO_KEY,
  IMPRIMIR_TICKET_LUEGO_DE_PAGAR_LABEL
} from '../imprimir-recibo-preference.constants';
import { FrontendActivityBufferService } from '../../../../core/monitoring/frontend-activity-buffer.service';
import { sanitizeActividadTexto } from '../../../../core/monitoring/frontend-ui-activity.util';
import { GuiaEnLineaService } from '../../../../core/components/guia-en-linea';
import { TicketsPosFocusService } from './tickets-pos-focus.service';
const LAST_TICKET_ID_KEY = 'last-ticket-id';
const FORCED_SELECTION_TICKET_ID_KEY = 'forced-selection-ticket-id';
/** Preferencia de layout de tabs de tickets (localStorage). */
const ESTILO_TICKETS_KEY = 'preferencias-estilo-tickets';

export type EstiloTicketsTabs = 'todo-en-linea' | '2-lineas';

@Component({
  selector: 'tickets',
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    VexPageLayoutComponent,
    VexPageLayoutHeaderDirective,
    VexPageLayoutContentDirective,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    DragDropModule,
    DetalleTicketComponent,
    ConfirmacionPagosPanelComponent,
    CxcTicketRailComponent
  ],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  providers: [TicketsPosFocusService]
})
export class TicketsComponent
  implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy
{
  tickets: TicketDto[] = [];
  /** CxC vigentes indexadas por ticketId. */
  cxcPorTicketId = new Map<number, CuentaPorCobrarDto>();
  /** Rail expandido solo para el ticket activo con crédito. */
  cxcRailExpanded = false;
  tabContextMenuPosition = { x: 0, y: 0 };
  private cxcSyncTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSyncedTotalByTicket = new Map<number, number>();
  private _selectedIndex = 0;
  get selectedIndex(): number {
    return this._selectedIndex;
  }
  set selectedIndex(value: number) {
    if (this._selectedIndex !== value) {
      this._selectedIndex = value;
      this.cxcRailExpanded = this.ticketMuestraPanelLateral(
        this.tickets[value]
      );
      const suppressedUntil = this._suppressAutoScrollUntil;
      // Diferir: MatTabNav._scrollToLabel usa offsetLeft del <a> (roto por .tab-item)
      // y pisa nuestro scroll si corremos solo en el mismo tick.
      queueMicrotask(() => {
        if (Date.now() >= suppressedUntil) {
          this.scrollSelectedTabIntoView();
        }
      });
    }
  }
  private _suppressAutoScrollUntil = 0;
  private scrollIntoViewTimers: ReturnType<typeof setTimeout>[] = [];
  sessionId: number | null = null;
  loading = false;
  headerActionsBusy = false;
  ticketTabsBusy = false;
  currentReciboId: number | null = null;
  /** Recibo expuesto al template solo tras setTimeout para evitar NG0100. */
  reciboForSearch: DetalleTicketComponent | null = null;
  private reciboForSearchScheduled = false;
  /** Elemento del input de búsqueda, asignado en setTimeout para evitar NG0100. */
  searchInputEl: HTMLInputElement | null = null;
  private searchInputElScheduled = false;
  @ViewChild('productSearchInput')
  productSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('reciboCmp') reciboComponent?: DetalleTicketComponent;
  @ViewChild('cxcRail') cxcRail?: CxcTicketRailComponent;
  @ViewChild('tabContextMenuTrigger')
  tabContextMenuTrigger?: MatMenuTrigger;
  @ViewChild('ticketTabNav', { read: ElementRef })
  ticketTabNavEl?: ElementRef<HTMLElement>;
  @ViewChild('ticketTabNav', { read: MatTabNav })
  matTabNav?: MatTabNav;
  @ViewChild('tabsTwoLines')
  tabsTwoLinesEl?: ElementRef<HTMLElement>;
  @ViewChild(ConfirmacionPagosPanelComponent)
  confirmacionPagosPanel?: ConfirmacionPagosPanelComponent;

  /** Preferencia de usuario: imprimir recibo tras pago (persistida en localStorage). Por defecto false. */
  imprimirReciboActivo = false;
  /** Etiqueta compartida con pago-efectivo-cambio (misma preferencia en localStorage). */
  readonly imprimirTicketLuegoDePagarLabel = IMPRIMIR_TICKET_LUEGO_DE_PAGAR_LABEL;
  recentPrintedRecibos: RecentPrintedReciboItem[] = [];

  /** True cuando los tickets con cliente personalizado (no ANONIMO) están visibles en la barra de tabs. */
  ticketsConClienteVisibles = true;

  /**
   * Layout de tabs: `todo-en-linea` (barra única + botones a la derecha) o
   * `2-lineas` (clientes arriba / anónimos abajo; botones junto al buscador).
   * Persistido en localStorage (`preferencias-estilo-tickets`).
   */
  estiloTickets: EstiloTicketsTabs = '2-lineas';

  /** Último ticketId sobre el cual el usuario hizo clic (persistido en localStorage para evitar llamadas HTTP redundantes). */
  private lastFetchedTicketId: number | null = null;

  /** ID del ticket que debe seleccionarse forzosamente después de recargar */
  private forcedSelectionTicketId: number | null = null;
  private recentPrintedRecibosSubscription?: Subscription;

  /**
   * Tras doble clic en un tab se abre EditarTabTicket; los click previos ya
   * programaron focusProductSearch — se suprime el foco al buscador hasta esta marca.
   * @deprecated Preferir TicketsPosFocusService.suppressFor / hold.
   */
  private get suppressProductSearchFocusUntil(): number {
    return 0;
  }
  private set suppressProductSearchFocusUntil(value: number) {
    const ms = Math.max(0, value - Date.now());
    if (ms > 0) {
      this.posFocus.suppressFor(ms);
    } else {
      this.posFocus.clearSuppress();
    }
  }

  /** Cantidad de productos movidos acumulados por ticket dividido. */
  private splitTicketProductCounts: Record<number, number> = {};

  /** Ticket destino asociado al comentario local del ticket origen. */
  private splitCommentsByTicketId: Record<number, number> = {};

  /**
   * Ticket rápido solo para No responsable de IVA (cuaderno / adaptación).
   * RESPONSABLE_IVA → oculto.
   */
  permiteTicketRapido = true;

  private readonly actividadUi = inject(FrontendActivityBufferService);
  private readonly posFocus = inject(TicketsPosFocusService);

  constructor(
    private ticketsService: TicketsService,
    private ticketReciboService: TicketReciboService,
    private dialog: MatDialog,
    private sesionesService: SesionesService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private reciboDetalleService: ReciboDetalleService,
    private appRef: ApplicationRef,
    private router: Router,
    private reciboPrintService: ReciboPrintService,
    private establecimientoService: EstablecimientoService,
    private cuentaPorCobrarService: CuentaPorCobrarService,
    private guiaEnLinea: GuiaEnLineaService
  ) {}

  ngOnInit(): void {
    this.estiloTickets = this.getEstiloTicketsFromStorage();
    this.imprimirReciboActivo = this.getImprimirReciboFromStorage();
    this.establecimientoService.loadActual().subscribe({
      next: (est) => {
        const regimen = (est?.regimenTributario || '').toUpperCase();
        this.permiteTicketRapido = regimen !== 'RESPONSABLE_IVA';
        this.cdr.markForCheck();
      },
      error: () => {
        this.permiteTicketRapido = true;
      }
    });
    this.recentPrintedRecibos =
      this.reciboPrintService.getRecentRecibosSnapshot();
    this.recentPrintedRecibosSubscription =
      this.reciboPrintService.recentRecibos$.subscribe((items) => {
        this.recentPrintedRecibos = items;
        this.cdr.detectChanges();
      });

    const stored = localStorage.getItem('session-id');
    const parsed = stored ? Number(stored) : NaN;
    if (!parsed || Number.isNaN(parsed)) {
      this.tickets = [];
      this.sessionId = null;
      return;
    }

    this.sessionId = parsed;
    this.lastFetchedTicketId = this.getLastTicketIdFromStorage();

    // Recuperar selección forzada del sessionStorage
    const forcedSelection = sessionStorage.getItem(
      FORCED_SELECTION_TICKET_ID_KEY
    );
    if (forcedSelection) {
      this.forcedSelectionTicketId = Number(forcedSelection);
      console.log(
        '🔄 Recuperada selección forzada del sessionStorage:',
        this.forcedSelectionTicketId
      );
    }

    this.loadTickets(parsed);
  }

  private getImprimirReciboFromStorage(): boolean {
    const v = localStorage.getItem(IMPRIMIR_RECIBO_KEY);
    return v === 'true';
  }

  private getEstiloTicketsFromStorage(): EstiloTicketsTabs {
    const v = localStorage.getItem(ESTILO_TICKETS_KEY);
    return v === 'todo-en-linea' ? 'todo-en-linea' : '2-lineas';
  }

  get isEstiloDosLineas(): boolean {
    return this.estiloTickets === '2-lineas';
  }

  get isEstiloTodoEnLinea(): boolean {
    return this.estiloTickets === 'todo-en-linea';
  }

  /** Tickets con cliente identificado (primera línea en modo 2-lineas). */
  get ticketsIdentificados(): TicketDto[] {
    return this.tickets.filter((t) => this.isTicketConCliente(t));
  }

  /** Tickets anónimos / sin cliente (segunda línea en modo 2-lineas). */
  get ticketsAnonimos(): TicketDto[] {
    return this.tickets.filter((t) => !this.isTicketConCliente(t));
  }

  ticketIndex(ticket: TicketDto): number {
    return this.tickets.findIndex((t) => t.id === ticket.id);
  }

  setEstiloTickets(estilo: EstiloTicketsTabs): void {
    if (this.estiloTickets === estilo) {
      return;
    }
    this.actividadUi.record(
      `botón acción: estilo de tabs de tickets (${estilo})`
    );
    this.estiloTickets = estilo;
    localStorage.setItem(ESTILO_TICKETS_KEY, estilo);
    // Tras recrear el mat-tab-nav (vuelta a todo-en-linea), reaplicar noop + scroll
    setTimeout(() => {
      if (this.isEstiloTodoEnLinea) {
        this.disableBrokenMatTabScrollToLabel();
        this.scrollSelectedTabIntoView();
      }
      this.cdr.detectChanges();
    }, 0);
  }

  toggleImprimirRecibo(event: { checked: boolean }): void {
    this.actividadUi.record(
      `botón acción: preferencia imprimir ticket tras pago (${event.checked ? 'activada' : 'desactivada'})`
    );
    this.imprimirReciboActivo = event.checked;
    localStorage.setItem(
      IMPRIMIR_RECIBO_KEY,
      String(this.imprimirReciboActivo)
    );
  }

  private getLastTicketIdFromStorage(): number | null {
    const v = localStorage.getItem(LAST_TICKET_ID_KEY);
    const n = v ? Number(v) : NaN;
    return Number.isNaN(n) ? null : n;
  }

  private saveLastTicketId(ticketId: number): void {
    console.log('💾 saveLastTicketId llamado:', {
      ticketId,
      lastFetchedTicketId: this.lastFetchedTicketId,
      forcedSelectionTicketId: this.forcedSelectionTicketId
    });

    this.lastFetchedTicketId = ticketId;
    localStorage.setItem(LAST_TICKET_ID_KEY, String(ticketId));
    console.log('💾 saveLastTicketId: guardado en localStorage:', ticketId);
  }

  ngAfterViewInit(): void {
    this.initPosFocus();
    this.focusProductSearch(false);
    this.disableBrokenMatTabScrollToLabel();
  }

  ngAfterViewChecked(): void {
    if (!this.tickets?.length || !this.reciboComponent) {
      this.reciboForSearchScheduled = false;
      this.searchInputElScheduled = false;
      this.reciboForSearch = null;
      this.searchInputEl = null;
    }

    const needsUpdate =
      this.tickets?.length &&
      this.reciboComponent &&
      this.reciboComponent !== this.reciboForSearch;
    if (needsUpdate && !this.reciboForSearchScheduled) {
      this.reciboForSearchScheduled = true;
      setTimeout(() => {
        const el = this.productSearchInput?.nativeElement;
        if (el) {
          this.searchInputEl = el;
          this.searchInputElScheduled = true;
          this.syncPosFocusInput();
          this.cdr.detectChanges();
        }
        this.reciboForSearch = this.reciboComponent || null;
        this.reciboForSearchScheduled = false;

        // Forzar foco después de cargar tickets
        setTimeout(() => {
          this.focusProductSearch(false);
        }, 100);
      }, 0);
    } else {
      this.syncPosFocusInput();
    }
  }

  ngOnDestroy(): void {
    this.enabledPosFocusListeners = false;
    this.posFocus.disable();
    this.recentPrintedRecibosSubscription?.unsubscribe();
    if (this.cxcSyncTimer != null) {
      clearTimeout(this.cxcSyncTimer);
      this.cxcSyncTimer = null;
    }
    for (const t of this.scrollIntoViewTimers) {
      clearTimeout(t);
    }
    this.scrollIntoViewTimers = [];
  }

  /**
   * MatTabNav._scrollToLabel usa offsetLeft del <a mat-tab-link>. Con el
   * wrapper .tab-item (position:relative) ese offset es ~padding (~12px),
   * no la posición real del tab → el scroll “vuelve” al inicio. Lo anulamos
   * y usamos solo scrollSelectedTabIntoView().
   */
  private disableBrokenMatTabScrollToLabel(): void {
    const nav = this.matTabNav as MatTabNav & {
      _scrollToLabel?: (labelIndex: number) => void;
    };
    if (nav && typeof nav._scrollToLabel === 'function') {
      nav._scrollToLabel = () => undefined;
    }
  }

  formatRecentReciboTotal(item: RecentPrintedReciboItem): string {
    return this.reciboPrintService.formatCurrency(item.total);
  }

  formatRecentReciboFecha(item: RecentPrintedReciboItem): string {
    return this.reciboPrintService.formatReciboFecha(item.fechaCreacion);
  }

  printRecentRecibo(item: RecentPrintedReciboItem): void {
    this.actividadUi.record(
      `botón acción: imprimir recibo reciente (reciboId: ${item.reciboId ?? '?'})`
    );
    const printed = this.reciboPrintService.printRecentRecibo(item);
    if (!printed) {
      this.snackBar.open(
        'Por favor, permite ventanas emergentes para imprimir',
        'Cerrar',
        {
          duration: 5000,
          horizontalPosition: 'right'
        }
      );
    }
  }

  /**
   * Enfoca #productSearchInput vía TicketsPosFocusService (holds + restore unificado).
   * @see `.cursor/rules/tickets-pos-focus-coordinator.md`
   */
  focusProductSearch(select: boolean = true): void {
    this.syncPosFocusInput();
    this.posFocus.requestDefaultFocus({ select });
  }

  @HostListener('document:focusout', ['$event'])
  onDocumentFocusOut(event: FocusEvent): void {
    if (!this.enabledPosFocusListeners) {
      return;
    }
    this.posFocus.onFocusOut(event.relatedTarget);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.enabledPosFocusListeners) {
      return;
    }
    if (this.posFocus.handlePossibleBarcodeKeydown(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private enabledPosFocusListeners = false;

  private syncPosFocusInput(): void {
    this.posFocus.attachInput(this.productSearchInput?.nativeElement);
  }

  private initPosFocus(): void {
    this.syncPosFocusInput();
    this.posFocus.enable();
    this.enabledPosFocusListeners = true;
    this.posFocus.setBarcodeCommitHandler((text) => {
      if (!this.reciboComponent) {
        return;
      }
      this.reciboComponent.productSearchCtrl.setValue(text, {
        emitEvent: false
      });
      this.reciboComponent.searchAndAddProduct();
    });
  }

  /**
   * Desplaza la barra de tabs para que el tab activo quede visible.
   * Usa la suma de anchos de .tab-item (no offsetLeft del <a>): Material
   * `_scrollToLabel` calcula mal por el wrapper `position:relative` y
   * suele “devolver” el scroll al inicio. Reaplicamos en varios ticks
   * para ganar esa carrera.
   */
  private scrollSelectedTabIntoView(): void {
    for (const t of this.scrollIntoViewTimers) {
      clearTimeout(t);
    }
    this.scrollIntoViewTimers = [];
    // Modo 2 líneas: cada fila hace scroll propio; no hay MatTabNav paginado
    if (this.isEstiloDosLineas) {
      this.scrollSelectedTabIntoViewDosLineas();
      return;
    }
    // Por si el ViewChild no estaba listo en AfterViewInit
    this.disableBrokenMatTabScrollToLabel();

    const apply = (): void => {
      if (Date.now() < this._suppressAutoScrollUntil) {
        return;
      }
      const navEl = this.ticketTabNavEl?.nativeElement;
      if (!navEl || this._selectedIndex < 0 || !this.matTabNav) {
        return;
      }

      const container = navEl.querySelector(
        '.mat-mdc-tab-link-container'
      ) as HTMLElement;
      if (!container) {
        return;
      }

      const tabItems = Array.from(
        navEl.querySelectorAll('.tab-item')
      ) as HTMLElement[];
      const targetEl = tabItems[this._selectedIndex];
      if (!targetEl || targetEl.classList.contains('tab-collapsed')) {
        return;
      }

      const offset = this.getTabItemContentOffset(tabItems, this._selectedIndex);
      const viewLength = container.offsetWidth;
      const currentScroll = this.matTabNav.scrollDistance;
      const targetEnd = offset + targetEl.offsetWidth;

      let newScroll = currentScroll;
      if (offset < currentScroll + 4) {
        newScroll = Math.max(0, offset - 4);
      } else if (targetEnd > currentScroll + viewLength - 4) {
        newScroll = targetEnd - viewLength + 4;
      } else {
        return;
      }

      if (Math.abs(newScroll - currentScroll) < 1) {
        return;
      }
      this.matTabNav.scrollDistance = newScroll;
    };

    apply();
    requestAnimationFrame(() => {
      apply();
      this.scrollIntoViewTimers.push(setTimeout(apply, 0));
      this.scrollIntoViewTimers.push(setTimeout(apply, 32));
      this.scrollIntoViewTimers.push(setTimeout(apply, 80));
    });
  }

  /** Offset horizontal del tab i dentro de la lista (contenido sin transform). */
  private getTabItemContentOffset(
    tabItems: HTMLElement[],
    index: number
  ): number {
    let offset = 0;
    for (let i = 0; i < index && i < tabItems.length; i++) {
      const el = tabItems[i];
      offset += el.offsetWidth;
      const mr = parseFloat(getComputedStyle(el).marginRight || '0');
      if (!Number.isNaN(mr)) {
        offset += mr;
      }
    }
    return offset;
  }

  /** En modo 2 líneas, centra el tab activo dentro de su fila con overflow-x. */
  private scrollSelectedTabIntoViewDosLineas(): void {
    requestAnimationFrame(() => {
      const host = this.tabsTwoLinesEl?.nativeElement;
      if (!host) {
        return;
      }
      const selected = host.querySelector(
        '.tab-item.is-selected'
      ) as HTMLElement | null;
      const row = selected?.closest('.tabs-line') as HTMLElement | null;
      if (!selected || !row) {
        return;
      }
      const rowRect = row.getBoundingClientRect();
      const tabRect = selected.getBoundingClientRect();
      const deltaLeft = tabRect.left - rowRect.left;
      const deltaRight = tabRect.right - rowRect.right;
      if (deltaLeft < 0) {
        row.scrollLeft += deltaLeft - 8;
      } else if (deltaRight > 0) {
        row.scrollLeft += deltaRight + 8;
      }
    });
  }

  get etiquetaTicketActivo(): string {
    const ticket = this.tickets[this.selectedIndex];
    return ticket ? this.getBaseTicketLabel(ticket) : 'ticket';
  }

  get etiquetaGenerarCreditoTicketActivo(): string {
    return `Generar crédito a: ${this.etiquetaTicketActivo}`;
  }

  get etiquetaComentarioTicketActivo(): string {
    const ticket = this.tickets[this.selectedIndex];
    const accion = this.ticketTieneObservacion(ticket)
      ? 'Editar comentario'
      : 'Registrar comentario';
    return `${accion} a: ${this.etiquetaTicketActivo}`;
  }

  getTicketLabel(ticket: TicketDto): string {
    if (ticket.cliente?.nombre) {
      return this.getBaseTicketLabel(ticket);
    }

    const productCount = this.splitTicketProductCounts[ticket.id];
    if (productCount !== undefined) {
      return `${this.getBaseTicketLabel(ticket)} (${productCount} ${this.getProductosLabel(productCount)})`;
    }

    return this.getBaseTicketLabel(ticket);
  }

  get ticketMoveOptions(): TicketMoveOption[] {
    const currentTicketId = this.tickets[this.selectedIndex]?.id ?? null;
    return this.tickets
      .filter((ticket) => ticket.id !== currentTicketId)
      .map((ticket) => ({
        id: ticket.id,
        label: this.getTicketLabel(ticket)
      }));
  }

  get activeSplitComment(): string | null {
    const currentTicketId = this.tickets[this.selectedIndex]?.id ?? null;
    if (!currentTicketId) {
      return null;
    }

    const targetTicketId = this.splitCommentsByTicketId[currentTicketId];
    if (!targetTicketId) {
      return null;
    }

    const targetTicket = this.tickets.find(
      (ticket) => ticket.id === targetTicketId
    );
    if (!targetTicket) {
      return null;
    }

    return `Se ha dividido este ticket o cuenta y enviado a '${this.getTicketLabel(targetTicket)}'`;
  }

  get headerActionsDisabled(): boolean {
    return this.sessionId === null || this.headerActionsBusy;
  }

  get ticketTabsDisabled(): boolean {
    return this.ticketTabsBusy;
  }

  private getBaseTicketLabel(ticket: TicketDto): string {
    if (ticket.cliente?.nombre) {
      const palabras = ticket.cliente.nombre.trim().split(/\s+/);
      return palabras.slice(0, 2).join(' ');
    }
    return ticket.nombre;
  }

  private getProductosLabel(count: number): string {
    return count === 1 ? 'producto' : 'productos';
  }

  /** TrackBy function para ngFor de tickets */
  trackByTicketId(index: number, ticket: TicketDto): number {
    return ticket.id;
  }

  /** True si al menos un ticket tiene un cliente con nombre (no ANONIMO). */
  get tieneTicketsConCliente(): boolean {
    return this.tickets.some((t) => !!t.cliente?.nombre);
  }

  /** Cantidad de tickets que tienen un cliente con nombre. */
  get cantidadTicketsConCliente(): number {
    return this.tickets.filter((t) => !!t.cliente?.nombre).length;
  }

  /** Determina si un ticket tiene un cliente personalizado (no ANONIMO). */
  isTicketConCliente(ticket: TicketDto): boolean {
    return !!ticket.cliente?.nombre;
  }

  /**
   * Verifica si un ticket tiene detalles de productos asignados.
   * Obtiene el recibo asociado al ticket y verifica si tiene detalles.
   */
  private async ticketTieneDetalles(ticket: TicketDto): Promise<boolean> {
    if (this.sessionId === null) {
      return false;
    }

    try {
      // Obtener la relación ticket-recibo
      const ticketRecibo = await this.ticketReciboService
        .getByTicketId(ticket.id, this.sessionId)
        .toPromise();

      if (!ticketRecibo?.reciboId) {
        return false;
      }

      // Obtener los detalles del recibo
      const detalles = await this.reciboDetalleService
        .getDetallesByRecibo(ticketRecibo.reciboId)
        .toPromise();

      return !!(detalles && detalles.length > 0);
    } catch (error) {
      console.error('Error verificando detalles del ticket:', error);
      return false;
    }
  }

  /** Alterna la visibilidad de los tabs de tickets con cliente personalizado. */
  toggleTicketsConCliente(): void {
    this.actividadUi.record(
      'botón acción: alternar visibilidad de tabs con cuenta de cliente'
    );
    const showing = !this.ticketsConClienteVisibles;
    this.ticketsConClienteVisibles = showing;

    // Suprimir el auto-scroll durante la transición CSS (0.35s),
    // el scroll inmediato calcularía mal porque offsetLeft aún no refleja
    // la posición final tras colapsar/expandir los tabs de clientes
    this._suppressAutoScrollUntil = Date.now() + 400;

    if (!showing) {
      // Ocultando clientes: si el seleccionado es cliente, saltar al primer no-cliente
      const selectedTicket = this.tickets[this.selectedIndex];
      if (selectedTicket && this.isTicketConCliente(selectedTicket)) {
        const firstNonClientIndex = this.tickets.findIndex(
          (t) => !this.isTicketConCliente(t)
        );
        if (firstNonClientIndex >= 0) {
          this.selectTicket(firstNonClientIndex);
        }
      }
    }

    // Reposicionar el scroll tras la transición CSS en ambos sentidos
    setTimeout(() => this.scrollSelectedTabIntoView(), 400);
  }

  /**
   * Si los tickets con cliente están ocultos y ya no queda ningún ticket
   * anónimo (sin cliente), des-agrupa automáticamente para que todos
   * los tabs sean visibles.
   */
  private desagruparSiSoloQuedanClientes(): void {
    if (this.ticketsConClienteVisibles) {
      return; // ya están visibles, nada que hacer
    }
    const quedaAlgunAnonimo = this.tickets.some(
      (t) => !this.isTicketConCliente(t)
    );
    if (!quedaAlgunAnonimo && this.tickets.length > 0) {
      this.ticketsConClienteVisibles = true;
    }
  }

  /**
   * keydown.enter (no keyup): si el usuario confirma con Enter en el modal
   * selector-productos, el keyup puede llegar a este input tras cerrar el overlay
   * y disparar otra búsqueda / reabrir el modal.
   */
  onProductSearchEnterKeydown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.isComposing) {
      return;
    }
    event.preventDefault();
    this.triggerProductSearch();
  }

  triggerProductSearch(): void {
    const term = this.reciboComponent?.productSearchCtrl?.value?.trim() ?? '';
    if (term) {
      this.actividadUi.record(
        `Enter / buscar producto (#productSearchInput): "${sanitizeActividadTexto(term, 120)}"`
      );
    } else {
      this.actividadUi.record(
        'Enter en #productSearchInput (búsqueda vacía → validación en detalle-ticket)'
      );
    }
    this.reciboComponent?.searchAndAddProduct();
    this.focusProductSearch(false);
  }

  clearProductSearch(): void {
    this.actividadUi.record('botón acción: limpiar búsqueda (#productSearchInput)');
    if (this.reciboComponent) {
      this.reciboComponent.productSearchCtrl.setValue('');
      this.focusProductSearch(false);
    }
  }

  async onMoveToNewTicketRequested(): Promise<void> {
    if (this.sessionId === null || this.loading || this.headerActionsBusy) {
      return;
    }

    const nextNumber = this.getNextTicketNumber();
    const nombre = `Ticket ${nextNumber}`;
    const qtyMap = await this.reciboComponent?.confirmMoveQuantitiesIfNeeded(
      nombre
    );
    if (!qtyMap) {
      return;
    }

    this.actividadUi.record(
      'acción: mover líneas a nuevo ticket (desde detalle-ticket)'
    );
    const reciboIdPadre = this.currentReciboId ?? undefined;

    try {
      this.headerActionsBusy = true;
      this.loading = true;
      const nuevoTicket = await firstValueFrom(
        this.ticketsService.createTicket(this.sessionId, nombre)
      );
      this.tickets = [...this.tickets, nuevoTicket];
      await this.processDetalleMove(nuevoTicket, true, reciboIdPadre, qtyMap);
    } catch (error) {
      this.loading = false;
      console.error('Error creando ticket para dividir productos', error);
      this.snackBar.open('No se pudo crear el ticket destino.', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
      this.headerActionsBusy = false;
      this.cdr.detectChanges();
    }
  }

  async onMoveToExistingTicketRequested(ticketId: number): Promise<void> {
    if (this.loading) {
      return;
    }

    const targetTicket = this.tickets.find((ticket) => ticket.id === ticketId);
    if (!targetTicket) {
      return;
    }

    const destinoLabel =
      this.getTicketLabel(targetTicket) ||
      targetTicket.nombre ||
      `Ticket ${targetTicket.id}`;
    const qtyMap = await this.reciboComponent?.confirmMoveQuantitiesIfNeeded(
      destinoLabel
    );
    if (!qtyMap) {
      return;
    }

    this.actividadUi.record(
      `acción: mover líneas a ticket existente (ticket destino id ${ticketId})`
    );

    await this.processDetalleMove(targetTicket, false, undefined, qtyMap);
  }

  onReciboReasignado(reciboId: number): void {
    this.currentReciboId = reciboId;
  }

  recargarRecibo(): void {
    // Recargar tickets cuando se actualiza el recibo
    if (this.sessionId !== null) {
      this.loadTickets(this.sessionId);
    } else if (
      this.selectedIndex >= 0 &&
      this.selectedIndex < this.tickets.length
    ) {
      this.fetchReciboForTicket(this.tickets[this.selectedIndex].id, true);
    }
    this.confirmacionPagosPanel?.revisarPendientes();
  }

  onTicketProcesado(): void {
    const currentTicketId = this.tickets[this.selectedIndex]?.id ?? null;
    if (!currentTicketId) {
      return;
    }

    delete this.splitTicketProductCounts[currentTicketId];
    delete this.splitCommentsByTicketId[currentTicketId];

    for (const sourceTicketId of Object.keys(this.splitCommentsByTicketId)) {
      if (
        this.splitCommentsByTicketId[Number(sourceTicketId)] === currentTicketId
      ) {
        delete this.splitCommentsByTicketId[Number(sourceTicketId)];
      }
    }
  }

  /**
   * Calcula el siguiente número disponible para un ticket nuevo.
   * Revisa todos los tickets existentes que tengan el formato "Ticket #",
   * obtiene el número más alto y le suma 1.
   * Ejemplo: si existen "DON IVAN", "PIPO", "Ticket 4" → devuelve 5.
   */
  private getNextTicketNumber(): number {
    let maxNumber = 0;
    const ticketPattern = /^Ticket\s*(\d+)$/i;
    for (const t of this.tickets) {
      const match = t.nombre?.match(ticketPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    // Si no se encontró ningún ticket con formato "Ticket #", usar la cantidad de tickets
    return maxNumber > 0 ? maxNumber + 1 : (this.tickets?.length || 0) + 1;
  }

  newTicket(): void {
    // Verificar si el input de búsqueda ya tiene el foco antes de crear el ticket
    const searchInput = this.productSearchInput?.nativeElement;
    const hadFocus = searchInput && document.activeElement === searchInput;

    if (this.sessionId === null || this.headerActionsBusy) {
      return;
    }
    const nextNumber = this.getNextTicketNumber();
    const nombre = `Ticket ${nextNumber}`;
    this.actividadUi.record('botón acción: Nuevo ticket');
    this.headerActionsBusy = true;
    this.loading = true;
    this.ticketsService.createTicket(this.sessionId, nombre).subscribe({
      next: (ticket) => {
        this.tickets = [...this.tickets, ticket];
        this.selectedIndex = this.tickets.length - 1;
        this.fetchReciboForTicket(ticket.id);
        this.loading = false;
        this.headerActionsBusy = false;

        // Siempre enfocar el input de búsqueda al crear un nuevo ticket
        setTimeout(() => {
          this.focusProductSearch(false);
        }, 100);
      },
      error: (err) => {
        this.loading = false;
        this.headerActionsBusy = false;
        console.error('Error creating ticket', err);

        // Mostrar mensaje de error al usuario
        let errorMessage =
          'Error al crear el ticket. Por favor, intente nuevamente.';

        if (err.status === 500) {
          errorMessage =
            'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontró la sesión de trabajo.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para crear tickets.';
        } else if (err.status === 0) {
          errorMessage =
            'Error de conexión con el servidor. Verifique su conexión a internet.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onOpcionesMenuOpened(): void {
    this.posFocus.hold('menu:opciones-recibo');
  }

  onOpcionesMenuClosed(): void {
    this.posFocus.release('menu:opciones-recibo');
  }

  openQuickRecibo(): void {
    if (this.sessionId === null || !this.permiteTicketRapido) {
      return;
    }
    this.actividadUi.record('despliega modal: ticket-rapido');
    this.posFocus.hold('dialog:ticket-rapido');
    const dialogRef = this.dialog.open<
      TicketRapidoComponent,
      TicketRapidoData,
      boolean
    >(TicketRapidoComponent, {
      width: '600px',
      data: { sesionId: this.sessionId },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.posFocus.release('dialog:ticket-rapido');
      if (result) {
        this.confirmacionPagosPanel?.revisarPendientes();
      }
    });
  }

  /**
   * Abre CxC desde el ticket activo (menú ⋮ o clic derecho en tab).
   * Requiere recibo cargado; el diálogo valida cliente y teléfono.
   */
  abrirCuentaPorCobrar(): void {
    const ticket = this.tickets[this.selectedIndex];
    if (!ticket) {
      this.snackBar.open('Seleccione un ticket', 'Cerrar', { duration: 3000 });
      return;
    }
    if (this.ticketTieneCredito(ticket)) {
      this.snackBar.open(
        'Este ticket ya tiene una cuenta por cobrar vigente.',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }
    const reciboId =
      this.currentReciboId ??
      ticket.reciboId ??
      this.reciboComponent?.recibo?.id ??
      null;
    if (reciboId == null) {
      this.snackBar.open(
        'El ticket aún no tiene recibo. Agregue productos primero.',
        'Cerrar',
        { duration: 4500 }
      );
      return;
    }
    const recibo = this.reciboComponent?.recibo;
    const totalFromDetalles = (this.reciboComponent?.detalles ?? []).reduce(
      (acc, d) => acc + (Number(d.subtotal) || 0),
      0
    );
    const totalRecibo =
      totalFromDetalles > 0
        ? totalFromDetalles
        : Number(recibo?.total ?? 0);
    const montoRecibido = Number(recibo?.montoRecibido ?? 0);
    if (!(totalRecibo > 0)) {
      this.snackBar.open(
        'El ticket no tiene total. Agregue productos antes de generar crédito.',
        'Cerrar',
        { duration: 4500 }
      );
      return;
    }

    this.actividadUi.record(
      `despliega modal: abrir-cuenta-por-cobrar (ticket: ${ticket.id})`
    );
    this.posFocus.hold('dialog:abrir-cxc');
    const dialogRef = this.dialog.open<
      AbrirCuentaPorCobrarDialogComponent,
      AbrirCuentaPorCobrarDialogData,
      CuentaPorCobrarDto | undefined
    >(AbrirCuentaPorCobrarDialogComponent, {
      width: '520px',
      data: {
        ticket,
        reciboId,
        totalRecibo,
        montoRecibido,
        sesionId: this.sessionId
      },
      autoFocus: true
    });
    dialogRef.afterClosed().subscribe((dto) => {
      this.posFocus.release('dialog:abrir-cxc');
      if (dto) {
        this.confirmacionPagosPanel?.revisarPendientes();
        if (dto.ticketId != null) {
          this.cxcPorTicketId.set(dto.ticketId, dto);
          const t =
            dto.totalTicket != null
              ? Math.round(Number(dto.totalTicket) || 0)
              : Math.round(totalRecibo);
          this.lastSyncedTotalByTicket.set(dto.ticketId, t);
        }
        this.refreshCxcMap();
        this.cxcRailExpanded = true;
        if (this.sessionId != null) {
          this.loadTickets(this.sessionId);
          this.fetchReciboForTicket(ticket.id, true);
        }
      }
    });
  }

  getCxcForTicket(ticket: TicketDto | null | undefined): CuentaPorCobrarDto | null {
    if (!ticket?.id) {
      return null;
    }
    return this.cxcPorTicketId.get(ticket.id) ?? null;
  }

  get activeTicketCxc(): CuentaPorCobrarDto | null {
    return this.getCxcForTicket(this.tickets[this.selectedIndex]);
  }

  get activeTicketYaTieneCredito(): boolean {
    return this.activeTicketCxc != null;
  }

  ticketTieneCredito(ticket: TicketDto): boolean {
    return this.getCxcForTicket(ticket) != null;
  }

  ticketTieneObservacion(ticket: TicketDto | null | undefined): boolean {
    return (ticket?.observaciones ?? '').trim().length > 0;
  }

  ticketMuestraPanelLateral(ticket: TicketDto | null | undefined): boolean {
    return (
      this.getCxcForTicket(ticket) != null || this.ticketTieneObservacion(ticket)
    );
  }

  /**
   * Clic derecho en tab: menú «Generar crédito» (sin menú nativo del navegador).
   */
  onTicketTabContextMenu(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (
      this.ticketTabsDisabled ||
      index < 0 ||
      index >= this.tickets.length
    ) {
      return;
    }
    if (this.selectedIndex !== index) {
      this.selectTicket(index);
    }
    this.tabContextMenuPosition = {
      x: event.clientX,
      y: event.clientY
    };
    this.cdr.detectChanges();
    setTimeout(() => this.tabContextMenuTrigger?.openMenu(), 0);
  }

  riesgoTicket(ticket: TicketDto): 'normal' | 'medio' | 'alto' {
    const cxc = this.getCxcForTicket(ticket);
    if (!cxc?.fechaOrigen) {
      return 'normal';
    }
    const origen = new Date(cxc.fechaOrigen).getTime();
    if (Number.isNaN(origen)) {
      return 'normal';
    }
    const dias = Math.max(0, Math.floor((Date.now() - origen) / 86400000));
    if (dias >= 35) {
      return 'alto';
    }
    if (dias >= 15) {
      return 'medio';
    }
    return 'normal';
  }

  tooltipCredito(ticket: TicketDto): string {
    const cxc = this.getCxcForTicket(ticket);
    if (!cxc) {
      return '';
    }
    return `Crédito · saldo ${this.formatCxcSaldo(cxc)} · ${this.riesgoTicket(ticket)}`;
  }

  formatCxcSaldo(cxc: CuentaPorCobrarDto): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Math.round(Number(cxc.saldoPendiente) || 0));
  }

  toggleCxcRail(): void {
    this.cxcRailExpanded = !this.cxcRailExpanded;
  }

  abrirObservacionTicket(): void {
    const ticket = this.tickets[this.selectedIndex];
    if (!ticket?.id) {
      this.snackBar.open('Seleccione un ticket', 'Cerrar', { duration: 3000 });
      return;
    }
    const data: TicketObservacionDialogData = {
      nombreTicket: ticket.nombre,
      observaciones: ticket.observaciones ?? ''
    };
    this.posFocus.hold('dialog:ticket-observacion');
    this.posFocus.suppressFor(400);
    this.dialog
      .open(TicketObservacionDialogComponent, {
        width: '420px',
        autoFocus: false,
        restoreFocus: false,
        data
      })
      .afterClosed()
      .subscribe((texto: string | null | undefined) => {
        this.posFocus.release('dialog:ticket-observacion');
        if (texto === undefined) {
          return;
        }
        const observaciones = (texto ?? '').trim() || null;
        this.ticketsService
          .actualizarObservaciones(ticket.id, observaciones)
          .subscribe({
            next: (updated) => {
              const idx = this.tickets.findIndex((t) => t.id === ticket.id);
              if (idx >= 0) {
                this.tickets[idx] = {
                  ...this.tickets[idx],
                  observaciones: updated?.observaciones ?? observaciones
                };
                this.tickets = [...this.tickets];
              }
              this.cxcRailExpanded = this.ticketMuestraPanelLateral(
                this.tickets[idx] ?? ticket
              );
              this.cdr.detectChanges();
            },
            error: () => {
              this.snackBar.open(
                'No se pudo guardar el comentario',
                'Cerrar',
                { duration: 4000 }
              );
            }
          });
      });
  }

  /**
   * Ayuda en línea: medios de pago deshabilitados por CxC → apuntar a Registrar abono.
   */
  mostrarGuiaAbonoCxc(): void {
    if (!this.activeTicketCxc || this.guiaEnLinea.isOpen) {
      return;
    }
    const abrirRail = !this.cxcRailExpanded;
    if (abrirRail) {
      this.cxcRailExpanded = true;
      this.cdr.detectChanges();
    }

    const lanzar = () => {
      const destino = document.querySelector<HTMLElement>(
        '.cxc-rail-cta--abonar'
      );
      if (!destino) {
        this.snackBar.open(
          'Abra el panel de crédito y use «Registrar abono» para cobrar.',
          'Cerrar',
          { duration: 4500 }
        );
        return;
      }
      this.guiaEnLinea.abrir({
        titulo: 'Cobranza con crédito',
        mensaje:
          'Una vez generado un crédito al cliente o pagos parciales al cliente, para continuar registrando pago total o aportes debe utilizar «Registrar abono».',
        origenes: [
          {
            el: '.metodos-pago-container',
            etiqueta: 'Métodos de pago'
          }
        ],
        destino: {
          el: '.cxc-rail-cta--abonar',
          etiqueta: 'Registrar abono'
        },
        cerrarLabel: 'Cerrar ayuda en línea'
      });
    };

    if (abrirRail) {
      setTimeout(lanzar, 80);
    } else {
      lanzar();
    }
  }

  imprimirTicketConCredito(): void {
    const cxc = this.activeTicketCxc;
    if (!cxc) {
      return;
    }
    const total =
      Number(cxc.totalTicket ?? cxc.montoOriginal) || 0;
    const abonado = Math.max(
      0,
      total - (Number(cxc.saldoPendiente) || 0)
    );
    if (!this.reciboComponent) {
      this.snackBar.open('No hay ticket cargado para imprimir.', 'Cerrar', {
        duration: 3500
      });
      return;
    }
    this.actividadUi.record(
      `botón acción: imprimir ticket con crédito (cxc: ${cxc.id})`
    );
    this.reciboComponent.imprimirTicketConCredito({
      abonado,
      saldoPendiente: Number(cxc.saldoPendiente) || 0,
      nota: 'Tiene crédito pendiente por pagar.'
    });
  }

  /**
   * Cualquier cambio de ítems del ticket (aunque el rail esté colapsado)
   * sincroniza total y saldo de la CxC vigente.
   */
  onTicketTotalChanged(total: number): void {
    const ticket = this.tickets[this.selectedIndex];
    if (!ticket?.id || !this.ticketTieneCredito(ticket)) {
      return;
    }
    const rounded = Math.round(Number(total) || 0);
    const prev = this.lastSyncedTotalByTicket.get(ticket.id);
    if (prev === rounded) {
      return;
    }
    if (this.cxcSyncTimer != null) {
      clearTimeout(this.cxcSyncTimer);
    }
    const ticketId = ticket.id;
    this.cxcSyncTimer = setTimeout(() => {
      this.sincronizarCxcConTotal(ticketId, rounded);
    }, 300);
  }

  private sincronizarCxcConTotal(ticketId: number, total: number): void {
    this.cuentaPorCobrarService.sincronizarTotalTicket(ticketId, total).subscribe({
      next: (dto) => {
        this.lastSyncedTotalByTicket.set(ticketId, total);
        if (dto) {
          this.cxcPorTicketId.set(ticketId, dto);
        } else {
          this.cxcPorTicketId.delete(ticketId);
          this.cxcRailExpanded = false;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        /* no bloquear venta si falla sync CxC */
      }
    });
  }

  /**
   * Panel QR faltante → ticket reabierto: recarga tabs y abre modal Generar crédito
   * con abono/saldo/medio fijos (email ya confirmado).
   */
  onCreditoDesdeFaltanteQr(dto: PendienteConfirmacionDto): void {
    const ticketId = dto?.ticketIdReabierto ?? null;
    const reciboId = dto?.reciboIdReabierto ?? null;
    const total = Number(dto?.totalTicketReabierto ?? dto?.montoEsperado ?? 0);
    const abono = Number(dto?.montoRecibido ?? 0);
    const saldo = Number(
      dto?.faltante ?? Math.max(0, total - abono)
    );

    const openModal = (ticket: TicketDto) => {
      if (reciboId == null || !(total > 0)) {
        this.snackBar.open(
          'Ticket reabierto. Use «Generar crédito» para registrar el faltante.',
          'Cerrar',
          { duration: 5000 }
        );
        return;
      }
      this.posFocus.hold('dialog:abrir-cxc');
      const dialogRef = this.dialog.open<
        AbrirCuentaPorCobrarDialogComponent,
        AbrirCuentaPorCobrarDialogData,
        CuentaPorCobrarDto | undefined
      >(AbrirCuentaPorCobrarDialogComponent, {
        width: '520px',
        disableClose: true,
        data: {
          ticket,
          reciboId,
          totalRecibo: total,
          montoRecibido: abono,
          sesionId: this.sessionId,
          bloquearMontos: true,
          abonoFijo: abono,
          saldoFijo: saldo,
          metodoPagoIdFijo: dto.metodoPagoId ?? null,
          historialElectronicoId: dto.id ?? null
        },
        autoFocus: true
      });
      dialogRef.afterClosed().subscribe((cxc) => {
        this.posFocus.release('dialog:abrir-cxc');
        if (cxc) {
          this.confirmacionPagosPanel?.revisarPendientes();
          if (cxc.ticketId != null) {
            this.cxcPorTicketId.set(cxc.ticketId, cxc);
            this.lastSyncedTotalByTicket.set(
              cxc.ticketId,
              Math.round(Number(cxc.totalTicket) || total)
            );
          }
          this.refreshCxcMap();
          this.cxcRailExpanded = true;
          if (this.sessionId != null) {
            this.loadTickets(this.sessionId);
            this.fetchReciboForTicket(ticket.id, true);
          }
        } else {
          this.snackBar.open(
            'Ticket reabierto sin crédito. Puede usar «Generar crédito» cuando identifique al cliente.',
            'Cerrar',
            { duration: 5500 }
          );
          if (this.sessionId != null) {
            this.loadTickets(this.sessionId);
          }
        }
        this.cdr.markForCheck();
      });
    };

    if (this.sessionId == null) {
      return;
    }

    this.snackBar.open(
      'Ticket reabierto por faltante QR. Identifique el cliente y cree el crédito.',
      'Cerrar',
      { duration: 4500 }
    );

    this.ticketsService.getTicketsBySession(this.sessionId).subscribe({
      next: (tickets) => {
        this.tickets = tickets ?? [];
        this.pruneSplitState();
        const ticket =
          (ticketId != null
            ? this.tickets.find((t) => t.id === ticketId)
            : null) ?? null;
        if (!ticket) {
          this.selectTicketAfterTicketsLoaded(this.sessionId!);
          this.snackBar.open(
            'No se encontró el ticket reabierto. Use «Generar crédito» en el tab correspondiente.',
            'Cerrar',
            { duration: 5500 }
          );
          this.cdr.markForCheck();
          return;
        }
        const idx = this.tickets.findIndex((t) => t.id === ticket.id);
        this.selectedIndex = idx >= 0 ? idx : 0;
        this.forcedSelectionTicketId = ticket.id;
        this.fetchReciboForTicket(ticket.id, true);
        openModal(ticket);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadTickets(this.sessionId!);
      }
    });
  }

  abrirAbonoCxc(cuenta?: CuentaPorCobrarDto | null): void {
    const cxc = cuenta ?? this.activeTicketCxc;
    if (!cxc) {
      return;
    }
    this.posFocus.hold('dialog:abono-cxc');
    const dialogRef = this.dialog.open<
      RegistrarAbonoCxcDialogComponent,
      RegistrarAbonoCxcDialogData,
      RegistrarAbonoCxcDialogResult | undefined
    >(RegistrarAbonoCxcDialogComponent, {
      width: '440px',
      data: { cuenta: cxc, sesionId: this.sessionId },
      autoFocus: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.posFocus.release('dialog:abono-cxc');
      if (!result) {
        return;
      }
      this.confirmacionPagosPanel?.revisarPendientes();
      if (result.cuenta.estado === 'PAGADA' || result.cuenta.estado === 'ANULADA') {
        if (result.cuenta.ticketId != null) {
          this.cxcPorTicketId.delete(result.cuenta.ticketId);
          this.tickets = this.tickets.map((t) =>
            t.id === result.cuenta.ticketId
              ? { ...t, observaciones: null }
              : t
          );
        }
        this.cxcRailExpanded = false;
        this.snackBar.open(
          'Crédito liquidado: ticket cerrado. Una compra nueva abre ticket nuevo.',
          'Cerrar',
          { duration: 5000 }
        );
        if (this.sessionId != null) {
          this.loadTickets(this.sessionId);
        }
      } else if (result.cuenta.ticketId != null) {
        this.cxcPorTicketId.set(result.cuenta.ticketId, result.cuenta);
      }
      this.refreshCxcMap();
      this.cxcRail?.refreshAbonos();
      this.cdr.markForCheck();
    });
  }

  /** Rail → Financiero CxC enfocado en este crédito (anular / castigar / etc.). */
  irACuentasPorCobrarDesdeTicket(): void {
    const cxc = this.activeTicketCxc;
    if (!cxc?.id) {
      return;
    }
    void this.router.navigate(['/apps/financiero/cuentas-por-cobrar'], {
      queryParams: { cxcId: cxc.id }
    });
  }

  private refreshCxcMap(): void {
    this.cuentaPorCobrarService.listarVigentes().subscribe({
      next: (rows) => {
        const map = new Map<number, CuentaPorCobrarDto>();
        for (const row of rows ?? []) {
          if (row.ticketId != null) {
            map.set(row.ticketId, row);
            if (row.totalTicket != null) {
              this.lastSyncedTotalByTicket.set(
                row.ticketId,
                Math.round(Number(row.totalTicket) || 0)
              );
            }
          }
        }
        this.cxcPorTicketId = map;
        const active = this.tickets[this.selectedIndex];
        if (this.ticketMuestraPanelLateral(active)) {
          this.cxcRailExpanded = true;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        /* silencioso: listado CxC no debe romper tickets */
      }
    });
  }

  editTicket(ticket: TicketDto, event: MouseEvent): void {
    event.stopPropagation();

    if (this.ticketTabsBusy) {
      return;
    }

    // Evitar que restores pendientes roben el foco al modal.
    this.posFocus.suppressFor(1200);
    this.posFocus.hold('dialog:editar-tab');

    this.actividadUi.record(
      `despliega modal: editar-tab-ticket (ticket: ${ticket.id}, ${sanitizeActividadTexto(ticket.nombre ?? '', 60)})`
    );
    const dialogRef = this.dialog.open<
      EditarTabTicketComponent,
      EditarTabTicketData,
      EditarTabTicketResult
    >(EditarTabTicketComponent, {
      width: '560px',
      data: {
        ticket,
        ticketsSesion: this.tickets,
        tieneProductos: (this.reciboComponent?.detalles?.length ?? 0) > 0
      },
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.posFocus.clearSuppress();
      this.posFocus.release('dialog:editar-tab');

      void this.handleEditarTabTicketResult(result);
    });
  }

  private async handleEditarTabTicketResult(
    result: EditarTabTicketResult | undefined
  ): Promise<void> {
    if (!result || this.sessionId === null) {
      return;
    }

    if (result.type === 'updated') {
      const ticketId = this.tickets[this.selectedIndex]?.id;
      this.loadTickets(this.sessionId);
      if (ticketId) {
        this.fetchReciboForTicket(ticketId, true);
      }
      return;
    }

    if (result.type === 'move-products') {
      this.actividadUi.record(
        `acción: mover productos al ticket con cliente ya asignado (destino id ${result.targetTicketId})`
      );
      this.reciboComponent?.selectAllDetalles();
      await this.onMoveToExistingTicketRequested(result.targetTicketId);
      const idx = this.tickets.findIndex((t) => t.id === result.targetTicketId);
      if (idx >= 0) {
        this.selectTicket(idx);
      }
      this.loadTickets(this.sessionId);
    }
  }

  /**
   * Selección en pointerdown (antes del umbral de cdkDrag) para que el clic
   * no se pierda cuando el tab está cerca de los botones `<`/`>` o tras scroll.
   */
  onTicketTabPointerDown(index: number, event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('.tab-close')) {
      return;
    }
    this.selectTicket(index);
  }

  /** Clic: refuerza selección (fallback) y foco al buscador en clic simple. */
  onTicketTabClick(index: number, event: MouseEvent): void {
    if (this.selectedIndex !== index) {
      this.selectTicket(index);
    }
    if (event.detail === 1) {
      this.focusProductSearch(false);
    }
  }

  onSearchInputKeydown(event: KeyboardEvent): void {
    // Prevenir que los símbolos + y - se escriban en el input de búsqueda
    // pero permitir que el evento continúe hacia el componente recibo
    if (
      event.key === '+' ||
      event.key === '-' ||
      event.key === 'NumpadAdd' ||
      event.key === 'NumpadSubtract'
    ) {
      const hasSearchText =
        (this.reciboComponent?.productSearchCtrl.value ?? '').length > 0;
      if (hasSearchText) {
        // Lectora escribiendo en el campo (p. ej. URL con guiones): no usar +/- como atajos.
        return;
      }
      event.preventDefault();
      // Sin texto en búsqueda, +/- ajusta cantidad del detalle seleccionado.
    }
  }

  selectTicket(index: number): void {
    console.log('🎯 selectTicket llamado:', {
      index,
      totalTickets: this.tickets.length,
      selectedTicket: this.tickets[index],
      currentSelectedIndex: this.selectedIndex,
      lastFetchedTicketId: this.lastFetchedTicketId,
      forcedSelectionTicketId: this.forcedSelectionTicketId
    });

    if (index < 0 || index >= this.tickets.length) {
      console.log('❌ selectTicket: índice inválido, retornando');
      return;
    }
    this.selectedIndex = index;
    const ticket = this.tickets[index];

    // Si el usuario hizo clic en el mismo ticket que ya estaba cargado, no hacer llamada HTTP
    if (
      this.lastFetchedTicketId === ticket.id &&
      this.currentReciboId !== null
    ) {
      console.log(
        '🔄 selectTicket: mismo ticket ya cargado, omitiendo llamada HTTP'
      );
      return;
    }

    console.log('📋 selectTicket: seleccionando ticket:', ticket);
    this.saveLastTicketId(ticket.id);
    this.fetchReciboForTicket(ticket.id, false, true);
  }

  onTicketDrop(event: CdkDragDrop<TicketDto[]>): void {
    if (this.ticketTabsBusy) {
      return;
    }

    if (event.previousIndex === event.currentIndex) {
      this.focusProductSearch(false);
      return;
    }

    this.actividadUi.record(
      `acción: reordenar tabs de tickets (índice ${event.previousIndex} → ${event.currentIndex})`
    );

    const selectedTicket = this.tickets[this.selectedIndex];
    moveItemInArray(this.tickets, event.previousIndex, event.currentIndex);

    if (selectedTicket) {
      this.selectedIndex = this.tickets.findIndex(
        (t) => t.id === selectedTicket.id
      );
    }

    this.persistTicketsOrder();
    this.focusProductSearch(false);
  }

  /**
   * Reordena dentro del grupo (identificados o anónimos) en modo 2 líneas.
   * El orden global queda: identificados primero, luego anónimos.
   */
  onTicketDropInGroup(
    event: CdkDragDrop<TicketDto[]>,
    group: 'identificados' | 'anonimos'
  ): void {
    if (this.ticketTabsBusy) {
      return;
    }
    if (event.previousIndex === event.currentIndex) {
      this.focusProductSearch(false);
      return;
    }

    this.actividadUi.record(
      `acción: reordenar tabs (${group}) índice ${event.previousIndex} → ${event.currentIndex}`
    );

    const selectedTicket = this.tickets[this.selectedIndex];
    const identificados = this.tickets.filter((t) => this.isTicketConCliente(t));
    const anonimos = this.tickets.filter((t) => !this.isTicketConCliente(t));
    const working = group === 'identificados' ? identificados : anonimos;
    moveItemInArray(working, event.previousIndex, event.currentIndex);
    this.tickets = [...identificados, ...anonimos];

    if (selectedTicket) {
      this.selectedIndex = this.tickets.findIndex(
        (t) => t.id === selectedTicket.id
      );
    }

    this.persistTicketsOrder();
    this.focusProductSearch(false);
  }

  private persistTicketsOrder(): void {
    this.tickets.forEach((t, i) => {
      t.orden = i + 1;
    });

    if (this.sessionId === null) {
      return;
    }

    this.ticketTabsBusy = true;
    const payload: TicketOrdenDto[] = this.tickets.map((t) => ({
      id: t.id,
      sessionId: t.sessionId,
      nombre: t.nombre,
      orden: t.orden
    }));
    this.ticketsService.updateTicketsOrder(payload).subscribe({
      next: () => {
        this.ticketTabsBusy = false;
      },
      error: (err) => {
        this.ticketTabsBusy = false;
        console.error('Error updating tickets order', err);

        let errorMessage =
          'Error al actualizar el orden de los tickets. Por favor, intente nuevamente.';

        if (err.status === 500) {
          errorMessage =
            'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontró la sesión de trabajo.';
        } else if (err.status === 403) {
          errorMessage =
            'No tiene permisos para modificar el orden de los tickets.';
        } else if (err.status === 0) {
          errorMessage =
            'Error de conexión con el servidor. Verifique su conexión a internet.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteTicket(ticket: TicketDto, index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.ticketTabsBusy) {
      return;
    }
    if (this.sessionId === null) {
      return;
    }

    // Si el ticket tiene un cliente personalizado (distinto de ADMINISTRADOR / id=1),
    // mostrar diálogo de confirmación antes de eliminar.
    const tieneClientePersonalizado = ticket.cliente && ticket.cliente.id !== 1;

    if (tieneClientePersonalizado) {
      const dialogData: ConfirmDialogData = {
        mensaje: `Esta cuenta fue personalizada para el cliente: <b>${this.getTicketLabel(ticket)}</b>, ¿está seguro que desea eliminar este ticket?`,
        titulo: 'Confirmar eliminación'
      };
      this.actividadUi.record(
        `despliega modal: confirmar eliminación de ticket (con cliente, id ${ticket.id})`
      );
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: dialogData,
        width: '400px',
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.executeDeleteTicket(ticket, index);
        } else {
          // Forzar actualización incluso si se cancela para asegurar estado consistente
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      });
    } else {
      // Para tickets no identificados, verificar si tienen detalles asignados
      this.ticketTieneDetalles(ticket)
        .then((tieneDetalles) => {
          // Forzar detección de cambios después de la operación asíncrona
          this.cdr.detectChanges();

          if (tieneDetalles) {
            const dialogData: ConfirmDialogData = {
              mensaje: `Esta cuenta tiene productos asignados, ¿está seguro que desea eliminar este ticket?`,
              titulo: 'Confirmar eliminación'
            };
            this.actividadUi.record(
              `despliega modal: confirmar eliminación de ticket (con productos, id ${ticket.id})`
            );
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
              data: dialogData,
              width: '400px',
              disableClose: true
            });
            dialogRef.afterClosed().subscribe((confirmado: boolean) => {
              if (confirmado) {
                this.executeDeleteTicket(ticket, index);
              } else {
                // Forzar actualización incluso si se cancela para asegurar estado consistente
                setTimeout(() => {
                  this.cdr.detectChanges();
                }, 100);
              }
            });
          } else {
            // Si no tiene cliente personalizado ni detalles, eliminar directamente
            this.executeDeleteTicket(ticket, index);
          }
        })
        .catch((error) => {
          console.error('Error verificando detalles del ticket:', error);
          // En caso de error, eliminar directamente para no bloquear la operación
          this.executeDeleteTicket(ticket, index);
        });
    }
  }

  /** Ejecuta la eliminación real del ticket (lógica extraída de deleteTicket). */
  private executeDeleteTicket(ticket: TicketDto, index: number): void {
    console.log(
      '🗑️ Iniciando eliminación del ticket:',
      ticket.id,
      'índice:',
      index
    );

    // Verificar si es un ticket no identificado y si quedan otros tickets no identificados
    const esTicketNoIdentificado = !this.isTicketConCliente(ticket);
    const ticketsNoIdentificados = this.tickets.filter(
      (t) => !this.isTicketConCliente(t)
    );
    const hayTicketsNoIdentificadosRestantes =
      esTicketNoIdentificado && ticketsNoIdentificados.length > 1;
    const esUltimoTicketNoIdentificado =
      esTicketNoIdentificado && ticketsNoIdentificados.length === 1;

    console.log('📊 Análisis de tickets:', {
      esTicketNoIdentificado,
      totalTicketsNoIdentificados: ticketsNoIdentificados.length,
      hayTicketsNoIdentificadosRestantes,
      esUltimoTicketNoIdentificado,
      ticketsConCliente: this.tickets.filter((t) => this.isTicketConCliente(t))
        .length
    });

    // Verificar si el input de búsqueda ya tiene el foco antes de eliminar el ticket
    const searchInput = this.productSearchInput?.nativeElement;
    const hadFocus = !!searchInput && document.activeElement === searchInput;

    this.ticketTabsBusy = true;
    this.loading = true;
    this.ticketsService.deleteTicket(ticket.id).subscribe({
      next: () => {
        console.log('✅ Ticket eliminado exitosamente en el backend');

        // Verificar si necesitamos crear un nuevo ticket o seleccionar uno existente
        if (esUltimoTicketNoIdentificado) {
          console.log(
            '🔄 Se eliminó el último ticket no identificado, creando uno nuevo...'
          );

          if (this.sessionId !== null) {
            const nextNumber = this.getNextTicketNumber();
            const nombre = `Ticket ${nextNumber}`;

            this.ticketsService.createTicket(this.sessionId, nombre).subscribe({
              next: (newTicket) => {
                console.log(
                  '➕ Nuevo ticket no identificado creado:',
                  newTicket
                );
                console.log('📋 Detalles del nuevo ticket:', {
                  id: newTicket.id,
                  nombre: newTicket.nombre,
                  cliente: newTicket.cliente,
                  esNoIdentificado: !newTicket.cliente?.nombre
                });

                // Establecer selección forzada para el nuevo ticket
                this.forcedSelectionTicketId = newTicket.id;
                console.log(
                  '🎯🎯 ESTABLECIENDO SELECCIÓN FORZADA para ticket ID:',
                  newTicket.id
                );
                this.refreshTicketsAfterDelete(hadFocus);
              },
              error: (err) => {
                console.error(
                  '❌ Error creando nuevo ticket no identificado:',
                  err
                );
                this.loading = false;
                this.ticketTabsBusy = false;

                // Mostrar mensaje de error al usuario
                let errorMessage =
                  'Error al crear un nuevo ticket. Por favor, recargue la página.';

                if (err.status === 500) {
                  errorMessage =
                    'Error interno del servidor. Contacte al administrador del sistema.';
                } else if (err.status === 404) {
                  errorMessage = 'No se encontró la sesión de trabajo.';
                } else if (err.status === 403) {
                  errorMessage = 'No tiene permisos para crear tickets.';
                } else if (err.status === 0) {
                  errorMessage =
                    'Error de conexión con el servidor. Verifique su conexión a internet.';
                }

                this.snackBar.open(errorMessage, 'Cerrar', {
                  duration: 5000,
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: ['error-snackbar']
                });
              }
            });
          } else {
            console.log('❌ SessionId es null, no se puede crear nuevo ticket');
            this.loading = false;
            this.ticketTabsBusy = false;
          }
        } else if (hayTicketsNoIdentificadosRestantes) {
          console.log(
            '🔄 Se eliminó un ticket no identificado pero quedan otros, seleccionando el siguiente...'
          );

          // Encontrar el siguiente ticket no identificado (excluyendo el que se va a eliminar)
          const ticketsNoIdentificadosRestantes = ticketsNoIdentificados.filter(
            (t) => t.id !== ticket.id
          );
          if (ticketsNoIdentificadosRestantes.length > 0) {
            const siguienteTicketNoIdentificado =
              ticketsNoIdentificadosRestantes[0]; // Tomar el primero disponible

            // Establecer selección forzada para el ticket existente
            this.forcedSelectionTicketId = siguienteTicketNoIdentificado.id;
            console.log(
              '🎯🎯 ESTABLECIENDO SELECCIÓN FORZADA para ticket existente ID:',
              siguienteTicketNoIdentificado.id
            );
            this.refreshTicketsAfterDelete(hadFocus);
          }
        } else {
          const targetTicketId = this.getNextTicketIdAfterDelete(
            ticket.id,
            index
          );
          this.forcedSelectionTicketId = targetTicketId;
          console.log(
            '🔄 Recargando tickets tras eliminación. Siguiente ticket:',
            targetTicketId
          );
          this.refreshTicketsAfterDelete(hadFocus);
        }
      },
      error: (err) => {
        console.error('❌ Error eliminando ticket:', err);
        this.loading = false;
        this.ticketTabsBusy = false;

        // Mostrar mensaje de error al usuario
        let errorMessage =
          'Error al eliminar el ticket. Por favor, intente nuevamente.';

        if (err.status === 500) {
          errorMessage =
            'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'El ticket que intenta eliminar no existe.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para eliminar este ticket.';
        } else if (err.status === 0) {
          errorMessage =
            'Error de conexión con el servidor. Verifique su conexión a internet.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private loadTickets(sessionId: number): void {
    console.log('📥 Cargando tickets para sesión:', sessionId);
    this.loading = true;
    this.refreshCxcMap();
    this.ticketsService.getTicketsBySession(sessionId).subscribe({
      next: (resp) => {
        const tickets = resp || [];
        console.log(
          '📋 Tickets recibidos del backend:',
          tickets.length,
          tickets
        );

        if (tickets.length === 0) {
          console.log('📭 No hay tickets, creando ticket inicial...');
          // No tickets found, create a new one
          const nombre = 'Ticket 1';
          this.ticketsService.createTicket(sessionId, nombre).subscribe({
            next: (newTicket) => {
              console.log('➕ Nuevo ticket creado:', newTicket);
              this.tickets = [newTicket];
              this.pruneSplitState();
              this.selectedIndex = 0;
              this.fetchReciboForTicket(newTicket.id, false, true);
              this.loading = false;
              this.ticketTabsBusy = false;

              // Forzar actualización completa de la aplicación
              this.cdr.detectChanges();
              this.appRef.tick();
              setTimeout(() => this.focusProductSearch(false), 100);
              console.log(
                '🔄 Interfaz actualizada después de crear ticket inicial (tick completo)'
              );
            },
            error: (err) => {
              console.error('❌ Error creando ticket inicial:', err);
              this.tickets = [];
              this.selectedIndex = -1;
              this.currentReciboId = null;
              this.loading = false;
              this.ticketTabsBusy = false;
            }
          });
        } else {
          console.log('📝 Asignando tickets al componente:', tickets);
          this.tickets = tickets;
          this.pruneSplitState();

          const tieneAnonimo = this.tickets.some(
            (t) => !this.isTicketConCliente(t)
          );
          if (!tieneAnonimo) {
            // Entrada a Tickets con solo cuentas identificadas: dejar al menos 1 anónimo listo.
            this.ensureAnonymousTicketOnLoad(sessionId);
            return;
          }

          this.selectTicketAfterTicketsLoaded(sessionId);
        }
      },
      error: (err) => {
        console.error('❌ Error cargando tickets:', err);
        this.tickets = [];
        this.selectedIndex = -1;
        this.currentReciboId = null;
        this.loading = false;
        this.ticketTabsBusy = false;

        // Mostrar mensaje de error al usuario
        let errorMessage =
          'Error al cargar los tickets. Por favor, recargue la página.';

        if (err.status === 500) {
          errorMessage =
            'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontró la sesión de trabajo.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para acceder a los tickets.';
        } else if (err.status === 0) {
          errorMessage =
            'Error de conexión con el servidor. Verifique su conexión a internet.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Si al cargar solo hay tickets con cliente, crea uno anónimo y lo selecciona.
   */
  private ensureAnonymousTicketOnLoad(sessionId: number): void {
    const nextNumber = this.getNextTicketNumber();
    const nombre = `Ticket ${nextNumber}`;
    this.actividadUi.record(
      `acción: crear ticket anónimo por defecto al entrar a Tickets (${nombre})`
    );
    this.ticketsService.createTicket(sessionId, nombre).subscribe({
      next: (newTicket) => {
        this.tickets = [...this.tickets, newTicket];
        this.pruneSplitState();
        this.selectedIndex = this.tickets.findIndex(
          (t) => t.id === newTicket.id
        );
        if (this.selectedIndex < 0) {
          this.selectedIndex = this.tickets.length - 1;
        }
        this.forcedSelectionTicketId = null;
        sessionStorage.removeItem(FORCED_SELECTION_TICKET_ID_KEY);
        this.fetchReciboForTicket(newTicket.id, false, true);
        this.loading = false;
        this.ticketTabsBusy = false;
        this.cdr.detectChanges();
        this.appRef.tick();
        setTimeout(() => this.focusProductSearch(false), 100);
      },
      error: (err) => {
        console.error('❌ Error creando ticket anónimo por defecto:', err);
        // Seguir con la selección normal sobre los tickets identificados.
        this.selectTicketAfterTicketsLoaded(sessionId);
      }
    });
  }

  /** Selección inicial tras loadTickets (forzada / ultimoTicketId / fallback). */
  private selectTicketAfterTicketsLoaded(sessionId: number): void {
    this.sesionesService.getSesionById(sessionId).subscribe({
      next: (sesion: SesionDto) => {
        let targetIndex = 0;

        if (this.forcedSelectionTicketId) {
          const forcedIndex = this.tickets.findIndex(
            (t) => t.id === this.forcedSelectionTicketId
          );
          if (forcedIndex >= 0) {
            targetIndex = forcedIndex;
          }
          this.forcedSelectionTicketId = null;
          sessionStorage.removeItem(FORCED_SELECTION_TICKET_ID_KEY);
        } else {
          const ultimoId = sesion?.ultimoTicketId ?? null;
          if (ultimoId) {
            const index = this.tickets.findIndex((t) => t.id === ultimoId);
            targetIndex = index >= 0 ? index : 0;
          } else {
            targetIndex = 0;
          }
        }

        this.selectedIndex = targetIndex;
        this.cxcRailExpanded = this.ticketMuestraPanelLateral(
          this.tickets[this.selectedIndex]
        );
        this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
        this.loading = false;
        this.ticketTabsBusy = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: (err) => {
        console.error('❌ Error cargando info de sesión:', err);
        this.selectedIndex = 0;
        this.cxcRailExpanded = this.ticketMuestraPanelLateral(
          this.tickets[this.selectedIndex]
        );
        this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
        this.loading = false;
        this.ticketTabsBusy = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  private fetchReciboForTicket(
    ticketId: number,
    forceReload: boolean = false,
    /** Tras aplicar reciboId (siguiente tick), volver a enfocar búsqueda (cambio de tab). */
    scheduleSearchFocusAfterApply: boolean = false
  ): void {
    console.log('🔍 fetchReciboForTicket llamado:', {
      ticketId,
      forceReload,
      currentReciboId: this.currentReciboId,
      sessionId: this.sessionId,
      forcedSelectionTicketId: this.forcedSelectionTicketId
    });

    if (!ticketId) {
      console.log('❌ fetchReciboForTicket: ticketId es nulo, retornando');
      this.currentReciboId = null;
      return;
    }
    if (this.sessionId === null) {
      console.log('❌ fetchReciboForTicket: sessionId es nulo, retornando');
      this.currentReciboId = null;
      return;
    }
    // Evita agregar productos al recibo del ticket anterior mientras llega el enlace nuevo
    // (p. ej. ticket recién creado o pestaña cambiada).
    if (this.lastFetchedTicketId !== ticketId) {
      this.currentReciboId = null;
    }
    this.ticketReciboService.getByTicketId(ticketId, this.sessionId).subscribe({
      next: (relation) => {
        console.log('✅ fetchReciboForTicket: relación obtenida:', relation);
        this.saveLastTicketId(ticketId);
        const nuevoReciboId = relation?.reciboId ?? null;
        console.log('📋 fetchReciboForTicket: nuevoReciboId:', nuevoReciboId);

        // Diferir actualización al siguiente ciclo para evitar NG0100 (ExpressionChangedAfterItHasBeenCheckedError):
        // el cambio de currentReciboId actualiza el hijo y el FormControl del buscador en el mismo tick.
        const aplicar = () => {
          console.log(
            '🔄 fetchReciboForTicket: aplicando cambios, currentReciboId:',
            nuevoReciboId
          );
          this.currentReciboId = nuevoReciboId;
          if (scheduleSearchFocusAfterApply) {
            this.focusProductSearch(false);
          }
        };
        if (
          forceReload &&
          nuevoReciboId &&
          this.currentReciboId === nuevoReciboId
        ) {
          console.log('🔄 fetchReciboForTicket: forzando reload');
          this.currentReciboId = null;
          setTimeout(aplicar, 0);
        } else {
          setTimeout(aplicar, 0);
        }
      },
      error: (err) => {
        console.error('Error loading ticket recibo relation', err);
        this.currentReciboId = null;

        // Mostrar mensaje de error al usuario
        let errorMessage =
          'Error al cargar el recibo del ticket. Por favor, intente nuevamente.';

        if (err.status === 500) {
          errorMessage =
            'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontró el recibo asociado al ticket.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para acceder al recibo.';
        } else if (err.status === 0) {
          errorMessage =
            'Error de conexión con el servidor. Verifique su conexión a internet.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private refreshTicketsAfterDelete(hadFocus: boolean): void {
    if (this.sessionId === null) {
      this.loading = false;
      this.ticketTabsBusy = false;
      return;
    }

    this.loadTickets(this.sessionId);

    if (hadFocus) {
      setTimeout(() => {
        this.focusProductSearch(false);
      }, 200);
    }
  }

  private getNextTicketIdAfterDelete(
    deletedTicketId: number,
    deletedIndex: number
  ): number | null {
    const remainingTickets = this.tickets.filter(
      (ticket) => ticket.id !== deletedTicketId
    );
    if (!remainingTickets.length) {
      return null;
    }

    const nextIndex = Math.min(deletedIndex, remainingTickets.length - 1);
    return remainingTickets[nextIndex]?.id ?? remainingTickets[0]?.id ?? null;
  }

  private async processDetalleMove(
    targetTicket: TicketDto,
    shouldTrackSplitLabel: boolean,
    reciboPadreId?: number,
    cantidadesPorDetalle?: Map<number, number> | null
  ): Promise<void> {
    try {
      const moveResult =
        await this.reciboComponent?.moveSelectedDetallesToTicket(
          targetTicket.id,
          reciboPadreId,
          cantidadesPorDetalle
        );
      if (!moveResult) {
        return;
      }

      if (
        shouldTrackSplitLabel ||
        this.splitTicketProductCounts[targetTicket.id] !== undefined
      ) {
        this.splitTicketProductCounts[targetTicket.id] =
          moveResult.targetProductCount;
      }

      this.splitCommentsByTicketId[moveResult.sourceTicketId] =
        moveResult.targetTicketId;

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error moviendo detalles entre tickets', error);
    }
  }

  private pruneSplitState(): void {
    const validTicketIds = new Set(this.tickets.map((ticket) => ticket.id));

    for (const key of Object.keys(this.splitTicketProductCounts)) {
      if (!validTicketIds.has(Number(key))) {
        delete this.splitTicketProductCounts[Number(key)];
      }
    }

    for (const key of Object.keys(this.splitCommentsByTicketId)) {
      const sourceTicketId = Number(key);
      const targetTicketId = this.splitCommentsByTicketId[sourceTicketId];
      if (
        !validTicketIds.has(sourceTicketId) ||
        !validTicketIds.has(targetTicketId)
      ) {
        delete this.splitCommentsByTicketId[Number(key)];
      }
    }
  }
}
