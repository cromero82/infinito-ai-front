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
import { TicketsService, TicketDto } from '../service/tickets.service';
import { TicketReciboService } from '../service/ticket-recibo.service';
import { SesionesService, SesionDto } from '../service/sesiones.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QuickReciboComponent, QuickReciboData } from '../quick-recibo/quick-recibo.component';

const IMPRIMIR_RECIBO_KEY = 'imprimir-recibo';

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
    NgIf,
    NgFor,
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

  /** Descarga el recibo del ticket actual como archivo HTML (abrir y Ctrl+P para imprimir/PDF). */
  descargarReciboActual(): void {
    const ok = this.reciboComponent?.descargarReciboActual();
    if (!ok) {
      this.snackBar.open('No hay recibo con productos para descargar', undefined, {
        duration: 3000,
        horizontalPosition: 'right'
      });
    }
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
        this.reciboForSearchScheduled = false;
        this.reciboForSearch = this.reciboComponent ?? null;
        this.cdr.detectChanges();
        const el = this.productSearchInput?.nativeElement;
        if (el) {
          this.searchInputEl = el;
          this.searchInputElScheduled = true;
          this.cdr.detectChanges();
        }
      }, 0);
    }
  }

  ngOnDestroy(): void {}

  focusProductSearch(select: boolean = true): void {
    setTimeout(() => {
      const input = this.productSearchInput?.nativeElement;
      if (input) {
        input.focus();
        if (select) {
          input.select();
        }
      }
    }, 0);
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

  newTicket(): void {
    if (this.sessionId === null) {
      return;
    }
    const nextNumber = (this.tickets?.length || 0) + 1;
    const nombre = `Ticket ${nextNumber}`;
    this.loading = true;
    this.ticketsService.createTicket(this.sessionId, nombre).subscribe({
      next: (ticket) => {
        this.tickets = [...this.tickets, ticket];
        this.selectedIndex = this.tickets.length - 1;
        this.fetchReciboForTicket(ticket.id);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creating ticket', err);
      }
    });
  }

  openQuickRecibo(): void {
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
    });
  }

  selectTicket(index: number): void {
    if (index < 0 || index >= this.tickets.length) {
      return;
    }
    this.selectedIndex = index;
    const ticket = this.tickets[index];
    this.fetchReciboForTicket(ticket.id);
  }

  deleteTicket(ticket: TicketDto, index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.loading) {
      return;
    }
    if (this.sessionId === null) {
      return;
    }
    this.loading = true;
    this.ticketsService.deleteTicket(ticket.id).subscribe({
      next: () => {
        const updated = [...this.tickets];
        updated.splice(index, 1);
        this.tickets = updated;
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
            },
            error: (err) => {
              console.error('Error creating ticket after deletion', err);
              this.selectedIndex = -1;
              this.currentReciboId = null;
              this.loading = false;
            }
          });
        } else if (this.selectedIndex >= this.tickets.length) {
          this.selectedIndex = this.tickets.length - 1;
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
          this.loading = false;
        } else if (this.selectedIndex === index) {
          this.selectedIndex = Math.max(0, index - 1);
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
          this.loading = false;
        } else {
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
          this.loading = false;
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
        const nuevoReciboId = relation?.reciboId ?? null;
        // Diferir actualización al siguiente ciclo para evitar NG0100 (ExpressionChangedAfterItHasBeenCheckedError):
        // el cambio de currentReciboId actualiza el hijo y el FormControl del buscador en el mismo tick.
        const aplicar = () => {
          this.currentReciboId = nuevoReciboId;
          if (this.currentReciboId) {
            this.focusProductSearch(false);
          }
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


