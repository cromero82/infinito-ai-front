import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReciboComponent } from '../recibo/recibo.component';
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
import { QuickReciboComponent, QuickReciboData } from '../quick-recibo/quick-recibo.component';
import { EditarTabTicketReciboComponent, EditarTabTicketReciboData } from '../editar-tab-ticket-recibo/editar-tab-ticket-recibo.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/components/confirm-dialog/confirm-dialog.component';

const IMPRIMIR_RECIBO_KEY = 'imprimir-recibo';
const LAST_TICKET_ID_KEY = 'last-ticket-id';

@Component({
  selector: 'vex-tickets-recibo',
  standalone: true,
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
    ReciboComponent
  ],
  templateUrl: './tickets-recibo.component.html',
  styleUrls: ['./tickets-recibo.component.scss']
})
export class TicketsReciboComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  tickets: TicketDto[] = [];
  selectedIndex = 0;
  sessionId: number | null = null;
  loading = false;
  currentReciboId: number | null = null;
  /** Recibo expuesto al template solo tras setTimeout para evitar NG0100. */
  reciboForSearch: ReciboComponent | null = null;
  private reciboForSearchScheduled = false;
  /** Elemento del input de búsqueda, asignado en setTimeout para evitar NG0100. */
  searchInputEl: HTMLInputElement | null = null;
  private searchInputElScheduled = false;
  @ViewChild('productSearchInput') productSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('reciboCmp') reciboComponent?: ReciboComponent;

  /** Preferencia de usuario: imprimir recibo tras pago (persistida en localStorage). Por defecto false. */
  imprimirReciboActivo = false;

  /** True cuando los tickets con cliente personalizado (no ANONIMO) están visibles en la barra de tabs. */
  ticketsConClienteVisibles = true;

  /** Último ticketId sobre el cual el usuario hizo clic (persistido en localStorage para evitar llamadas HTTP redundantes). */
  private lastFetchedTicketId: number | null = null;

  constructor(
    private ticketsService: TicketsService,
    private ticketReciboService: TicketReciboService,
    private dialog: MatDialog,
    private sesionesService: SesionesService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('session-id');
    const parsed = stored ? Number(stored) : NaN;
    if (!parsed || Number.isNaN(parsed)) {
      this.tickets = [];
      this.sessionId = null;
      return;
    }

    this.sessionId = parsed;
    this.imprimirReciboActivo = this.getImprimirReciboFromStorage();
    this.lastFetchedTicketId = this.getLastTicketIdFromStorage();
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
    this.lastFetchedTicketId = ticketId;
    localStorage.setItem(LAST_TICKET_ID_KEY, String(ticketId));
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
    // Limpiar variables
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
      const palabras = ticket.cliente.nombre.trim().split(/\s+/);
      return palabras.slice(0, 2).join(' ');
    }
    return ticket.nombre;
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

  recargarRecibo(): void {
    // Recargar tickets cuando se actualiza el recibo
    if (this.sessionId !== null) {
      this.loadTickets(this.sessionId);
    } else if (this.selectedIndex >= 0 && this.selectedIndex < this.tickets.length) {
      this.fetchReciboForTicket(this.tickets[this.selectedIndex].id, true);
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
    
    if (this.sessionId === null) {
      return;
    }
    const nextNumber = this.getNextTicketNumber();
    const nombre = `Ticket ${nextNumber}`;
    this.loading = true;
    this.ticketsService.createTicket(this.sessionId, nombre).subscribe({
      next: (ticket) => {
        this.tickets = [...this.tickets, ticket];
        this.selectedIndex = this.tickets.length - 1;
        this.fetchReciboForTicket(ticket.id);
        this.loading = false;
        
        // Siempre enfocar el input de búsqueda al crear un nuevo ticket
        setTimeout(() => {
          this.focusProductSearch(false);
        }, 100);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creating ticket', err);
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
    const dialogRef = this.dialog.open<QuickReciboComponent, QuickReciboData, boolean>(
      QuickReciboComponent,
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
    
    if (this.loading) {
      return;
    }

    const dialogRef = this.dialog.open<EditarTabTicketReciboComponent, EditarTabTicketReciboData, boolean>(
      EditarTabTicketReciboComponent,
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
    if (index < 0 || index >= this.tickets.length) {
      return;
    }
    this.selectedIndex = index;
    const ticket = this.tickets[index];

    // Si el usuario hizo clic en el mismo ticket que ya estaba cargado, no hacer llamada HTTP
    if (this.lastFetchedTicketId === ticket.id && this.currentReciboId !== null) {
      return;
    }

    this.saveLastTicketId(ticket.id);
    this.fetchReciboForTicket(ticket.id);
  }

  onTicketDrop(event: CdkDragDrop<TicketDto[]>): void {
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
      const payload: TicketOrdenDto[] = this.tickets.map(t => ({
        id: t.id,
        sessionId: t.sessionId,
        nombre: t.nombre,
        orden: t.orden
      }));
      this.ticketsService.updateTicketsOrder(payload).subscribe({
        next: () => {
          // Orden actualizado exitosamente
        },
        error: (err) => {
          console.error('Error updating tickets order', err);
        }
      });
    }
  }

  deleteTicket(ticket: TicketDto, index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.loading) {
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
        }
      });
    } else {
      this.executeDeleteTicket(ticket, index);
    }
  }

  /** Ejecuta la eliminación real del ticket (lógica extraída de deleteTicket). */
  private executeDeleteTicket(ticket: TicketDto, index: number): void {
    // Verificar si el input de búsqueda ya tiene el foco antes de eliminar el ticket
    const searchInput = this.productSearchInput?.nativeElement;
    const hadFocus = searchInput && document.activeElement === searchInput;
    
    this.loading = true;
    this.ticketsService.deleteTicket(ticket.id).subscribe({
      next: () => {
        const updated = [...this.tickets];
        updated.splice(index, 1);
        this.tickets = updated;
        
        // Ajustar selectedIndex si es necesario
        if (this.selectedIndex >= updated.length) {
          this.selectedIndex = Math.max(0, updated.length - 1);
        }
        
        this.desagruparSiSoloQuedanClientes();
        if (this.tickets.length === 0) {
          // No tickets left, create a new one
          if (this.sessionId === null) {
            this.selectedIndex = -1;
            this.currentReciboId = null;
            this.loading = false;
            return;
          }
          const nombre = 'Ticket 1';
          this.ticketsService.createTicket(this.sessionId, nombre).subscribe({
            next: (newTicket) => {
              this.tickets = [newTicket];
              this.selectedIndex = 0;
              this.fetchReciboForTicket(newTicket.id);
              this.loading = false;
              
              // Restaurar el foco si lo tenía antes
              if (hadFocus) {
                setTimeout(() => {
                  this.focusProductSearch(false);
                }, 100);
              }
            },
            error: (err) => {
              console.error('Error creating ticket after deletion', err);
              this.selectedIndex = -1;
              this.currentReciboId = null;
              this.loading = false;
              
              // Restaurar el foco si lo tenía antes
              if (hadFocus) {
                setTimeout(() => {
                  this.focusProductSearch(false);
                }, 100);
              }
            }
          });
        } else if (this.selectedIndex >= this.tickets.length) {
          this.selectedIndex = this.tickets.length - 1;
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
          this.loading = false;
          
          // Restaurar el foco si lo tenía antes
          if (hadFocus) {
            setTimeout(() => {
              this.focusProductSearch(false);
            }, 100);
          }
        } else if (this.selectedIndex === index) {
          this.selectedIndex = Math.max(0, index - 1);
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
          this.loading = false;
          
          // Restaurar el foco si lo tenía antes
          if (hadFocus) {
            setTimeout(() => {
              this.focusProductSearch(false);
            }, 100);
          }
        } else {
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
          this.loading = false;
          
          // Restaurar el foco si lo tenía antes
          if (hadFocus) {
            setTimeout(() => {
              this.focusProductSearch(false);
            }, 100);
          }
        }
      },
      error: (err) => {
        console.error('Error deleting ticket', err);
        this.loading = false;
      }
    });
  }

  private loadTickets(sessionId: number): void {
    this.loading = true;
    this.ticketsService.getTicketsBySession(sessionId).subscribe({
      next: (resp) => {
        const tickets = resp || [];
        if (tickets.length === 0) {
          // No tickets found, create a new one
          const nombre = 'Ticket 1';
          this.ticketsService.createTicket(sessionId, nombre).subscribe({
            next: (newTicket) => {
              this.tickets = [newTicket];
              this.selectedIndex = 0;
              this.fetchReciboForTicket(newTicket.id);
              this.loading = false;
            },
            error: (err) => {
              console.error('Error creating initial ticket', err);
              this.tickets = [];
              this.selectedIndex = -1;
              this.currentReciboId = null;
              this.loading = false;
            }
          });
        } else {
          this.tickets = tickets;

          // Consultar la sesión para obtener ultimoTicketId y seleccionar ese ticket
          this.sesionesService.getSesionById(sessionId).subscribe({
            next: (sesion: SesionDto) => {
              const ultimoId = sesion?.ultimoTicketId ?? null;

              if (ultimoId) {
                const index = this.tickets.findIndex((t) => t.id === ultimoId);
                this.selectedIndex = index >= 0 ? index : 0;
              } else {
                this.selectedIndex = 0;
              }

              this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
              this.loading = false;
            },
            error: (err) => {
              console.error('Error loading session info', err);
              // Fallback al comportamiento anterior
              this.selectedIndex = 0;
              this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
              this.loading = false;
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.tickets = [];
        this.selectedIndex = -1;
        this.currentReciboId = null;
        this.loading = false;
      }
    });
  }

  private fetchReciboForTicket(ticketId: number, forceReload: boolean = false): void {
    if (!ticketId) {
      this.currentReciboId = null;
      return;
    }
    if (this.sessionId === null) {
      this.currentReciboId = null;
      return;
    }
    this.ticketReciboService.getByTicketId(ticketId, this.sessionId).subscribe({
      next: (relation) => {
        this.saveLastTicketId(ticketId);
        const nuevoReciboId = relation?.reciboId ?? null;
        // Diferir actualización al siguiente ciclo para evitar NG0100 (ExpressionChangedAfterItHasBeenCheckedError):
        // el cambio de currentReciboId actualiza el hijo y el FormControl del buscador en el mismo tick.
        const aplicar = () => {
          this.currentReciboId = nuevoReciboId;
          // No enfocar automáticamente el input de búsqueda aquí
          // Los métodos que llaman a fetchReciboForTicket se encargarán de restaurar el foco si es necesario
        };
        if (forceReload && nuevoReciboId && this.currentReciboId === nuevoReciboId) {
          this.currentReciboId = null;
          setTimeout(aplicar, 0);
        } else {
          setTimeout(aplicar, 0);
        }
      },
      error: (err) => {
        console.error('Error loading ticket recibo relation', err);
        this.currentReciboId = null;
      }
    });
  }

}


