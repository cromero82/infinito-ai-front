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
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { MatTabsModule, MatTabNav } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';
import {
  DetalleTicketComponent,
  TicketMoveOption
} from '../detalle-ticket/detalle-ticket.component';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import {
  IMPRIMIR_RECIBO_KEY,
  IMPRIMIR_TICKET_LUEGO_DE_PAGAR_LABEL
} from '../imprimir-recibo-preference.constants';
import { FrontendActivityBufferService } from '../../../../core/monitoring/frontend-activity-buffer.service';
import { sanitizeActividadTexto } from '../../../../core/monitoring/frontend-ui-activity.util';
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
    DragDropModule,
    DetalleTicketComponent
  ],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent
  implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy
{
  tickets: TicketDto[] = [];
  private _selectedIndex = 0;
  get selectedIndex(): number {
    return this._selectedIndex;
  }
  set selectedIndex(value: number) {
    if (this._selectedIndex !== value) {
      this._selectedIndex = value;
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
  @ViewChild('ticketTabNav', { read: ElementRef })
  ticketTabNavEl?: ElementRef<HTMLElement>;
  @ViewChild('ticketTabNav', { read: MatTabNav })
  matTabNav?: MatTabNav;
  @ViewChild('tabsTwoLines')
  tabsTwoLinesEl?: ElementRef<HTMLElement>;

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
  estiloTickets: EstiloTicketsTabs = 'todo-en-linea';

  /** Último ticketId sobre el cual el usuario hizo clic (persistido en localStorage para evitar llamadas HTTP redundantes). */
  private lastFetchedTicketId: number | null = null;

  /** ID del ticket que debe seleccionarse forzosamente después de recargar */
  private forcedSelectionTicketId: number | null = null;
  private recentPrintedRecibosSubscription?: Subscription;

  /**
   * Tras doble clic en un tab se abre EditarTabTicket; los click previos ya
   * programaron focusProductSearch — se suprime el foco al buscador hasta esta marca.
   */
  private suppressProductSearchFocusUntil = 0;

  /** Cantidad de productos movidos acumulados por ticket dividido. */
  private splitTicketProductCounts: Record<number, number> = {};

  /** Ticket destino asociado al comentario local del ticket origen. */
  private splitCommentsByTicketId: Record<number, number> = {};

  private readonly actividadUi = inject(FrontendActivityBufferService);

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
    private reciboPrintService: ReciboPrintService
  ) {}

  ngOnInit(): void {
    this.estiloTickets = this.getEstiloTicketsFromStorage();
    this.imprimirReciboActivo = this.getImprimirReciboFromStorage();
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
    return v === '2-lineas' ? '2-lineas' : 'todo-en-linea';
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
          this.cdr.detectChanges();
        }
        this.reciboForSearch = this.reciboComponent || null;
        this.reciboForSearchScheduled = false;

        // Forzar foco después de cargar tickets
        setTimeout(() => {
          this.focusProductSearch(false);
        }, 100);
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.recentPrintedRecibosSubscription?.unsubscribe();
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
   * Enfoca #productSearchInput. Usa doble requestAnimationFrame + reintentos
   * porque mat-tab-nav suele devolver el foco al tab activo unos ms después
   * del clic, y al cambiar de ticket el reciboId se aplica en un tick distinto.
   */
  focusProductSearch(select: boolean = true): void {
    const applyFocus = (): boolean => {
      if (Date.now() < this.suppressProductSearchFocusUntil) {
        return false;
      }
      const input = this.productSearchInput?.nativeElement;
      if (!input) {
        return false;
      }
      input.focus({ preventScroll: true });
      if (select) {
        input.select();
      }
      return document.activeElement === input;
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          applyFocus();
        }, 100);
        setTimeout(() => {
          if (!applyFocus()) {
            setTimeout(() => applyFocus(), 220);
          }
        }, 320);
      });
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

    this.actividadUi.record(
      'acción: mover líneas a nuevo ticket (desde detalle-ticket)'
    );
    const nextNumber = this.getNextTicketNumber();
    const nombre = `Ticket ${nextNumber}`;
    const reciboIdPadre = this.currentReciboId ?? undefined;

    try {
      this.headerActionsBusy = true;
      this.loading = true;
      const nuevoTicket = await firstValueFrom(
        this.ticketsService.createTicket(this.sessionId, nombre)
      );
      this.tickets = [...this.tickets, nuevoTicket];
      await this.processDetalleMove(nuevoTicket, true, reciboIdPadre);
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

    this.actividadUi.record(
      `acción: mover líneas a ticket existente (ticket destino id ${ticketId})`
    );
    const targetTicket = this.tickets.find((ticket) => ticket.id === ticketId);
    if (!targetTicket) {
      return;
    }

    await this.processDetalleMove(targetTicket, false);
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

  openQuickRecibo(): void {
    // Verificar si el input de búsqueda ya tiene el foco antes de abrir el diálogo
    const searchInput = this.productSearchInput?.nativeElement;
    const hadFocus = searchInput && document.activeElement === searchInput;

    if (this.sessionId === null) {
      return;
    }
    this.actividadUi.record('despliega modal: ticket-rapido');
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
      if (result) {
        // Optionally reload tickets or show success message
        // this.loadTickets(this.sessionId!);
      }

      // Restaurar el foco si lo tenía antes
      if (hadFocus) {
        setTimeout(() => {
          this.focusProductSearch(false);
        }, 100);
      }
    });
  }

  editTicket(ticket: TicketDto, event: MouseEvent): void {
    event.stopPropagation();
    // Verificar si el input de búsqueda ya tiene el foco antes de editar el ticket
    const searchInput = this.productSearchInput?.nativeElement;
    const hadFocus = searchInput && document.activeElement === searchInput;

    if (this.ticketTabsBusy) {
      return;
    }

    // Evitar que los focusProductSearch ya programados por los click del doble clic
    // quiten el foco al modal (MatDialog con autoFocus: false).
    this.suppressProductSearchFocusUntil = Date.now() + 1200;

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
      // Con supresión del foco en #productSearchInput, el primer control del modal puede enfocarse.
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.suppressProductSearchFocusUntil = 0;

      void this.handleEditarTabTicketResult(result).finally(() => {
        if (hadFocus) {
          setTimeout(() => {
            this.focusProductSearch(false);
          }, 100);
        }
      });
    });
  }

  private async handleEditarTabTicketResult(
    result: EditarTabTicketResult | undefined
  ): Promise<void> {
    if (!result || this.sessionId === null) {
      return;
    }

    if (result.type === 'updated') {
      this.loadTickets(this.sessionId);
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
              this.fetchReciboForTicket(newTicket.id);
              this.loading = false;
              this.ticketTabsBusy = false;

              // Forzar actualización completa de la aplicación
              this.cdr.detectChanges();
              this.appRef.tick();
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

          // Consultar la sesión para obtener ultimoTicketId y seleccionar ese ticket
          this.sesionesService.getSesionById(sessionId).subscribe({
            next: (sesion: SesionDto) => {
              let targetIndex = 0;

              // MÁXIMA PRIORIDAD: Usar selección forzada si existe
              if (this.forcedSelectionTicketId) {
                const forcedIndex = this.tickets.findIndex(
                  (t) => t.id === this.forcedSelectionTicketId
                );
                if (forcedIndex >= 0) {
                  targetIndex = forcedIndex;
                  console.log(
                    '🎯🎯 USANDO SELECCIÓN FORZADA - ticket ID:',
                    this.forcedSelectionTicketId,
                    'índice:',
                    targetIndex
                  );
                  console.log(
                    '📋 Ticket seleccionado:',
                    this.tickets[targetIndex]
                  );
                } else {
                  console.log(
                    '⚠️ Ticket forzado no encontrado, usando selección normal'
                  );
                }
                // Limpiar la selección forzada después de usarla
                this.forcedSelectionTicketId = null;
                sessionStorage.removeItem(FORCED_SELECTION_TICKET_ID_KEY);
                console.log(
                  '🧹 Selección forzada utilizada y limpiada del sessionStorage'
                );
              } else {
                // Comportamiento normal: usar ultimoTicketId de la sesión
                const ultimoId = sesion?.ultimoTicketId ?? null;
                console.log('🎯 Último ticket ID desde sesión:', ultimoId);

                if (ultimoId) {
                  const index = this.tickets.findIndex(
                    (t) => t.id === ultimoId
                  );
                  targetIndex = index >= 0 ? index : 0;
                } else {
                  targetIndex = 0;
                }
                console.log('📍 Selección normal - índice:', targetIndex);
              }

              this.selectedIndex = targetIndex;
              console.log(
                '📍📍 SelectedIndex FINAL establecido en:',
                this.selectedIndex
              );
              console.log(
                '📋📋 Ticket seleccionado:',
                this.tickets[this.selectedIndex]
              );

              this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
              this.loading = false;
              this.ticketTabsBusy = false;

              // Forzar actualización completa de la aplicación
              this.cdr.detectChanges();
              this.appRef.tick();
              console.log(
                '🔄 Interfaz actualizada después de cargar tickets (tick completo)'
              );
            },
            error: (err) => {
              console.error('❌ Error cargando info de sesión:', err);
              // Fallback al comportamiento anterior
              this.selectedIndex = 0;
              this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
              this.loading = false;
              this.ticketTabsBusy = false;

              // Forzar actualización completa de la aplicación
              this.cdr.detectChanges();
              this.appRef.tick();
              console.log(
                '🔄 Interfaz actualizada (fallback con tick completo)'
              );
            }
          });
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
    reciboPadreId?: number
  ): Promise<void> {
    try {
      const moveResult =
        await this.reciboComponent?.moveSelectedDetallesToTicket(
          targetTicket.id,
          reciboPadreId
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
