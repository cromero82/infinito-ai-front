import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef, ChangeDetectionStrategy, ApplicationRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DetalleTicketComponent, TicketMoveOption } from '../detalle-ticket/detalle-ticket.component';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexBreadcrumbsComponent } from '@vex/components/vex-breadcrumbs/vex-breadcrumbs.component';
import { TicketsService, TicketDto, TicketOrdenDto } from '../service/tickets.service';
import { TicketReciboService } from '../service/ticket-recibo.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SesionesService, SesionDto } from '../service/sesiones.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketRapidoComponent, TicketRapidoData } from '../ticket-rapido/ticket-rapido.component';
import { EditarTabTicketComponent, EditarTabTicketData } from '../editar-tab-ticket/editar-tab-ticket.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import { ReciboDetalleService } from '../service/recibo-detalle.service';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';
import { RecentPrintedReciboItem, ReciboPrintService } from '../service/recibo-print.service';

const IMPRIMIR_RECIBO_KEY = 'imprimir-recibo';
const LAST_TICKET_ID_KEY = 'last-ticket-id';
const FORCED_SELECTION_TICKET_ID_KEY = 'forced-selection-ticket-id';

@Component({
    selector: 'tickets',
    changeDetection: ChangeDetectionStrategy.Default,
    imports: [
        VexPageLayoutComponent,
        VexPageLayoutHeaderDirective,
        VexPageLayoutContentDirective,
        VexBreadcrumbsComponent,
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
        NgIf,
        NgFor,
        DragDropModule,
        DetalleTicketComponent
    ],
    templateUrl: './tickets.component.html',
    styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  tickets: TicketDto[] = [];
  selectedIndex = 0;
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
  @ViewChild('productSearchInput') productSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('reciboCmp') reciboComponent?: DetalleTicketComponent;

  /** Preferencia de usuario: imprimir recibo tras pago (persistida en localStorage). Por defecto false. */
  imprimirReciboActivo = false;
  recentPrintedRecibos: RecentPrintedReciboItem[] = [];

  /** True cuando los tickets con cliente personalizado (no ANONIMO) están visibles en la barra de tabs. */
  ticketsConClienteVisibles = true;

  /** Último ticketId sobre el cual el usuario hizo clic (persistido en localStorage para evitar llamadas HTTP redundantes). */
  private lastFetchedTicketId: number | null = null;

  /** ID del ticket que debe seleccionarse forzosamente después de recargar */
  private forcedSelectionTicketId: number | null = null;
  private recentPrintedRecibosSubscription?: Subscription;

  /** Cantidad de productos movidos acumulados por ticket dividido. */
  private splitTicketProductCounts: Record<number, number> = {};

  /** Ticket destino asociado al comentario local del ticket origen. */
  private splitCommentsByTicketId: Record<number, number> = {};

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
    this.imprimirReciboActivo = this.getImprimirReciboFromStorage();
    this.recentPrintedRecibos = this.reciboPrintService.getRecentRecibosSnapshot();
    this.recentPrintedRecibosSubscription = this.reciboPrintService.recentRecibos$.subscribe((items) => {
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
    const forcedSelection = sessionStorage.getItem(FORCED_SELECTION_TICKET_ID_KEY);
    if (forcedSelection) {
      this.forcedSelectionTicketId = Number(forcedSelection);
      console.log('🔄 Recuperada selección forzada del sessionStorage:', this.forcedSelectionTicketId);
    }
    
    this.loadTickets(parsed);
  }

  private getImprimirReciboFromStorage(): boolean {
    const v = localStorage.getItem(IMPRIMIR_RECIBO_KEY);
    return v === 'true';
  }

  toggleImprimirRecibo(event: { checked: boolean }): void {
    this.imprimirReciboActivo = event.checked;
    localStorage.setItem(IMPRIMIR_RECIBO_KEY, String(this.imprimirReciboActivo));
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
  }

  ngAfterViewChecked(): void {
    if (!this.tickets?.length || !this.reciboComponent) {
      this.reciboForSearchScheduled = false;
      this.searchInputElScheduled = false;
      this.reciboForSearch = null;
      this.searchInputEl = null;
    }
    
    const needsUpdate = this.tickets?.length && this.reciboComponent && this.reciboComponent !== this.reciboForSearch;
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
  }

  formatRecentReciboTotal(item: RecentPrintedReciboItem): string {
    return this.reciboPrintService.formatCurrency(item.total);
  }

  formatRecentReciboFecha(item: RecentPrintedReciboItem): string {
    return this.reciboPrintService.formatReciboFecha(item.fechaCreacion);
  }

  printRecentRecibo(item: RecentPrintedReciboItem): void {
    const printed = this.reciboPrintService.printRecentRecibo(item);
    if (!printed) {
      this.snackBar.open('Por favor, permite ventanas emergentes para imprimir', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'right'
      });
    }
  }

  focusProductSearch(select: boolean = true): void {
    setTimeout(() => {
      const input = this.productSearchInput?.nativeElement;
      console.log('focusProductSearch llamado, input:', input);
      if (input) {
        input.focus();
        console.log('Focus aplicado al input de búsqueda');
        if (select) {
          input.select();
        }
      } else {
        console.warn('No se encontró el input de búsqueda para hacer focus');
      }
    }, 100);
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

    const targetTicket = this.tickets.find((ticket) => ticket.id === targetTicketId);
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
    return this.tickets.some(t => !!t.cliente?.nombre);
  }

  /** Cantidad de tickets que tienen un cliente con nombre. */
  get cantidadTicketsConCliente(): number {
    return this.tickets.filter(t => !!t.cliente?.nombre).length;
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
      const ticketRecibo = await this.ticketReciboService.getByTicketId(ticket.id, this.sessionId).toPromise();
      
      if (!ticketRecibo?.reciboId) {
        return false;
      }

      // Obtener los detalles del recibo
      const detalles = await this.reciboDetalleService.getDetallesByRecibo(ticketRecibo.reciboId).toPromise();
      
      return !!(detalles && detalles.length > 0);
    } catch (error) {
      console.error('Error verificando detalles del ticket:', error);
      return false;
    }
  }

  /** Alterna la visibilidad de los tabs de tickets con cliente personalizado. */
  toggleTicketsConCliente(): void {
    this.ticketsConClienteVisibles = !this.ticketsConClienteVisibles;

    if (!this.ticketsConClienteVisibles) {
      const selectedTicket = this.tickets[this.selectedIndex];
      if (selectedTicket && this.isTicketConCliente(selectedTicket)) {
        const firstNonClientIndex = this.tickets.findIndex(t => !this.isTicketConCliente(t));
        if (firstNonClientIndex >= 0) {
          this.selectTicket(firstNonClientIndex);
        }
      }
    }
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
    const quedaAlgunAnonimo = this.tickets.some(t => !this.isTicketConCliente(t));
    if (!quedaAlgunAnonimo && this.tickets.length > 0) {
      this.ticketsConClienteVisibles = true;
    }
  }

  triggerProductSearch(): void {
    this.reciboComponent?.searchAndAddProduct();
    this.focusProductSearch(false);
  }

  clearProductSearch(): void {
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
    const reciboIdPadre = this.currentReciboId ?? undefined;

    try {
      this.headerActionsBusy = true;
      this.loading = true;
      const nuevoTicket = await firstValueFrom(this.ticketsService.createTicket(this.sessionId, nombre));
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
    } else if (this.selectedIndex >= 0 && this.selectedIndex < this.tickets.length) {
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
      if (this.splitCommentsByTicketId[Number(sourceTicketId)] === currentTicketId) {
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
        let errorMessage = 'Error al crear el ticket. Por favor, intente nuevamente.';
        
        if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontró la sesión de trabajo.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para crear tickets.';
        } else if (err.status === 0) {
          errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
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
    const dialogRef = this.dialog.open<TicketRapidoComponent, TicketRapidoData, boolean>(
      TicketRapidoComponent,
      {
        width: '600px',
        data: { sesionId: this.sessionId },
        autoFocus: false
      }
    );

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

    const dialogRef = this.dialog.open<EditarTabTicketComponent, EditarTabTicketData, boolean>(
      EditarTabTicketComponent,
      {
        width: '560px',
        data: { ticket },
        autoFocus: false
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.sessionId !== null) {
        // Recargar tickets para reflejar el cambio de cliente
        this.loadTickets(this.sessionId);
      }
      
      // Restaurar el foco si lo tenía antes
      if (hadFocus) {
        setTimeout(() => {
          this.focusProductSearch(false);
        }, 100);
      }
    });
  }

  onSearchInputKeydown(event: KeyboardEvent): void {
    // Prevenir que los símbolos + y - se escriban en el input de búsqueda
    // pero permitir que el evento continúe hacia el componente recibo
    if (event.key === '+' || event.key === '-' || event.key === 'NumpadAdd' || event.key === 'NumpadSubtract') {
      event.preventDefault();
      // No detener la propagación para que handleKeyboardShortcuts del recibo lo maneje
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
    if (this.lastFetchedTicketId === ticket.id && this.currentReciboId !== null) {
      console.log('🔄 selectTicket: mismo ticket ya cargado, omitiendo llamada HTTP');
      return;
    }

    console.log('📋 selectTicket: seleccionando ticket:', ticket);
    this.saveLastTicketId(ticket.id);
    this.fetchReciboForTicket(ticket.id);
  }

  onTicketDrop(event: CdkDragDrop<TicketDto[]>): void {
    if (this.ticketTabsBusy) {
      return;
    }

    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Preservar el ticket actualmente seleccionado
    const selectedTicket = this.tickets[this.selectedIndex];

    // Reordenar el array local
    moveItemInArray(this.tickets, event.previousIndex, event.currentIndex);

    // Actualizar selectedIndex para seguir al ticket que estaba seleccionado
    if (selectedTicket) {
      this.selectedIndex = this.tickets.findIndex(t => t.id === selectedTicket.id);
    }

    // Recalcular el campo orden (1-based) según la nueva posición
    this.tickets.forEach((t, i) => {
      t.orden = i + 1;
    });

    // Persistir el nuevo orden en el backend
    if (this.sessionId !== null) {
      this.ticketTabsBusy = true;
      const payload: TicketOrdenDto[] = this.tickets.map(t => ({
        id: t.id,
        sessionId: t.sessionId,
        nombre: t.nombre,
        orden: t.orden
      }));
      this.ticketsService.updateTicketsOrder(payload).subscribe({
        next: () => {
          // Orden actualizado exitosamente
          this.ticketTabsBusy = false;
        },
        error: (err) => {
          this.ticketTabsBusy = false;
          console.error('Error updating tickets order', err);
          
          // Mostrar mensaje de error al usuario
          let errorMessage = 'Error al actualizar el orden de los tickets. Por favor, intente nuevamente.';
          
          if (err.status === 500) {
            errorMessage = 'Error interno del servidor. Contacte al administrador del sistema.';
          } else if (err.status === 404) {
            errorMessage = 'No se encontró la sesión de trabajo.';
          } else if (err.status === 403) {
            errorMessage = 'No tiene permisos para modificar el orden de los tickets.';
          } else if (err.status === 0) {
            errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          
          // Revertir el orden local si falla el backend
          // Esto requeriría tener una copia del orden anterior, por ahora solo mostramos el error
        }
      });
    }
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
      this.ticketTieneDetalles(ticket).then(tieneDetalles => {
        // Forzar detección de cambios después de la operación asíncrona
        this.cdr.detectChanges();
        
        if (tieneDetalles) {
          const dialogData: ConfirmDialogData = {
            mensaje: `Esta cuenta tiene productos asignados, ¿está seguro que desea eliminar este ticket?`,
            titulo: 'Confirmar eliminación'
          };
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
      }).catch(error => {
        console.error('Error verificando detalles del ticket:', error);
        // En caso de error, eliminar directamente para no bloquear la operación
        this.executeDeleteTicket(ticket, index);
      });
    }
  }

  /** Ejecuta la eliminación real del ticket (lógica extraída de deleteTicket). */
  private executeDeleteTicket(ticket: TicketDto, index: number): void {
    console.log('🗑️ Iniciando eliminación del ticket:', ticket.id, 'índice:', index);
    
    // Verificar si es un ticket no identificado y si quedan otros tickets no identificados
    const esTicketNoIdentificado = !this.isTicketConCliente(ticket);
    const ticketsNoIdentificados = this.tickets.filter(t => !this.isTicketConCliente(t));
    const hayTicketsNoIdentificadosRestantes = esTicketNoIdentificado && ticketsNoIdentificados.length > 1;
    const esUltimoTicketNoIdentificado = esTicketNoIdentificado && ticketsNoIdentificados.length === 1;
    
    console.log('📊 Análisis de tickets:', {
      esTicketNoIdentificado,
      totalTicketsNoIdentificados: ticketsNoIdentificados.length,
      hayTicketsNoIdentificadosRestantes,
      esUltimoTicketNoIdentificado,
      ticketsConCliente: this.tickets.filter(t => this.isTicketConCliente(t)).length
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
          console.log('🔄 Se eliminó el último ticket no identificado, creando uno nuevo...');
          
          if (this.sessionId !== null) {
            const nextNumber = this.getNextTicketNumber();
            const nombre = `Ticket ${nextNumber}`;
            
            this.ticketsService.createTicket(this.sessionId, nombre).subscribe({
              next: (newTicket) => {
                console.log('➕ Nuevo ticket no identificado creado:', newTicket);
                console.log('📋 Detalles del nuevo ticket:', {
                  id: newTicket.id,
                  nombre: newTicket.nombre,
                  cliente: newTicket.cliente,
                  esNoIdentificado: !newTicket.cliente?.nombre
                });
                
                // Establecer selección forzada para el nuevo ticket
                this.forcedSelectionTicketId = newTicket.id;
                console.log('🎯🎯 ESTABLECIENDO SELECCIÓN FORZADA para ticket ID:', newTicket.id);
                this.refreshTicketsAfterDelete(hadFocus);
              },
              error: (err) => {
                console.error('❌ Error creando nuevo ticket no identificado:', err);
                this.loading = false;
                this.ticketTabsBusy = false;
                
                // Mostrar mensaje de error al usuario
                let errorMessage = 'Error al crear un nuevo ticket. Por favor, recargue la página.';
                
                if (err.status === 500) {
                  errorMessage = 'Error interno del servidor. Contacte al administrador del sistema.';
                } else if (err.status === 404) {
                  errorMessage = 'No se encontró la sesión de trabajo.';
                } else if (err.status === 403) {
                  errorMessage = 'No tiene permisos para crear tickets.';
                } else if (err.status === 0) {
                  errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
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
          console.log('🔄 Se eliminó un ticket no identificado pero quedan otros, seleccionando el siguiente...');
          
          // Encontrar el siguiente ticket no identificado (excluyendo el que se va a eliminar)
          const ticketsNoIdentificadosRestantes = ticketsNoIdentificados.filter(t => t.id !== ticket.id);
          if (ticketsNoIdentificadosRestantes.length > 0) {
            const siguienteTicketNoIdentificado = ticketsNoIdentificadosRestantes[0]; // Tomar el primero disponible
            
            // Establecer selección forzada para el ticket existente
            this.forcedSelectionTicketId = siguienteTicketNoIdentificado.id;
            console.log('🎯🎯 ESTABLECIENDO SELECCIÓN FORZADA para ticket existente ID:', siguienteTicketNoIdentificado.id);
            this.refreshTicketsAfterDelete(hadFocus);
          }
        } else {
          const targetTicketId = this.getNextTicketIdAfterDelete(ticket.id, index);
          this.forcedSelectionTicketId = targetTicketId;
          console.log('🔄 Recargando tickets tras eliminación. Siguiente ticket:', targetTicketId);
          this.refreshTicketsAfterDelete(hadFocus);
        }
      },
      error: (err) => {
        console.error('❌ Error eliminando ticket:', err);
        this.loading = false;
        this.ticketTabsBusy = false;
        
        // Mostrar mensaje de error al usuario
        let errorMessage = 'Error al eliminar el ticket. Por favor, intente nuevamente.';
        
        if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'El ticket que intenta eliminar no existe.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para eliminar este ticket.';
        } else if (err.status === 0) {
          errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
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
        console.log('📋 Tickets recibidos del backend:', tickets.length, tickets);
        
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
              console.log('🔄 Interfaz actualizada después de crear ticket inicial (tick completo)');
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
                const forcedIndex = this.tickets.findIndex((t) => t.id === this.forcedSelectionTicketId);
                if (forcedIndex >= 0) {
                  targetIndex = forcedIndex;
                  console.log('🎯🎯 USANDO SELECCIÓN FORZADA - ticket ID:', this.forcedSelectionTicketId, 'índice:', targetIndex);
                  console.log('📋 Ticket seleccionado:', this.tickets[targetIndex]);
                } else {
                  console.log('⚠️ Ticket forzado no encontrado, usando selección normal');
                }
                // Limpiar la selección forzada después de usarla
                this.forcedSelectionTicketId = null;
                sessionStorage.removeItem(FORCED_SELECTION_TICKET_ID_KEY);
                console.log('🧹 Selección forzada utilizada y limpiada del sessionStorage');
              } else {
                // Comportamiento normal: usar ultimoTicketId de la sesión
                const ultimoId = sesion?.ultimoTicketId ?? null;
                console.log('🎯 Último ticket ID desde sesión:', ultimoId);

                if (ultimoId) {
                  const index = this.tickets.findIndex((t) => t.id === ultimoId);
                  targetIndex = index >= 0 ? index : 0;
                } else {
                  targetIndex = 0;
                }
                console.log('📍 Selección normal - índice:', targetIndex);
              }
              
              this.selectedIndex = targetIndex;
              console.log('📍📍 SelectedIndex FINAL establecido en:', this.selectedIndex);
              console.log('📋📋 Ticket seleccionado:', this.tickets[this.selectedIndex]);

              this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
              this.loading = false;
              this.ticketTabsBusy = false;
              
              // Forzar actualización completa de la aplicación
              this.cdr.detectChanges();
              this.appRef.tick();
              console.log('🔄 Interfaz actualizada después de cargar tickets (tick completo)');
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
              console.log('🔄 Interfaz actualizada (fallback con tick completo)');
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
        let errorMessage = 'Error al cargar los tickets. Por favor, recargue la página.';
        
        if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontró la sesión de trabajo.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para acceder a los tickets.';
        } else if (err.status === 0) {
          errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
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

  private fetchReciboForTicket(ticketId: number, forceReload: boolean = false): void {
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
          console.log('🔄 fetchReciboForTicket: aplicando cambios, currentReciboId:', nuevoReciboId);
          this.currentReciboId = nuevoReciboId;
          // No enfocar automáticamente el input de búsqueda aquí
          // Los métodos que llaman a fetchReciboForTicket se encargarán de restaurar el foco si es necesario
        };
        if (forceReload && nuevoReciboId && this.currentReciboId === nuevoReciboId) {
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
        let errorMessage = 'Error al cargar el recibo del ticket. Por favor, intente nuevamente.';
        
        if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Contacte al administrador del sistema.';
        } else if (err.status === 404) {
          errorMessage = 'No se encontró el recibo asociado al ticket.';
        } else if (err.status === 403) {
          errorMessage = 'No tiene permisos para acceder al recibo.';
        } else if (err.status === 0) {
          errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.';
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

  private getNextTicketIdAfterDelete(deletedTicketId: number, deletedIndex: number): number | null {
    const remainingTickets = this.tickets.filter((ticket) => ticket.id !== deletedTicketId);
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
      const moveResult = await this.reciboComponent?.moveSelectedDetallesToTicket(targetTicket.id, reciboPadreId);
      if (!moveResult) {
        return;
      }

      if (shouldTrackSplitLabel || this.splitTicketProductCounts[targetTicket.id] !== undefined) {
        this.splitTicketProductCounts[targetTicket.id] = moveResult.targetProductCount;
      }

      this.splitCommentsByTicketId[moveResult.sourceTicketId] = moveResult.targetTicketId;

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
      if (!validTicketIds.has(sourceTicketId) || !validTicketIds.has(targetTicketId)) {
        delete this.splitCommentsByTicketId[Number(key)];
      }
    }
  }

}


