import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

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
    NgIf,
    NgFor,
    ReciboComponent
  ],
  templateUrl: './tickets-recibo.component.html',
  styleUrls: ['./tickets-recibo.component.scss']
})
export class TicketsReciboComponent implements OnInit, AfterViewInit {
  tickets: TicketDto[] = [];
  selectedIndex = 0;
  sessionId: number | null = null;
  loading = false;
  currentReciboId: number | null = null;
  @ViewChild('productSearchInput') productSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('reciboCmp') reciboComponent?: ReciboComponent;

  constructor(
    private ticketsService: TicketsService,
    private ticketReciboService: TicketReciboService
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
    this.loadTickets(parsed);
  }

  ngAfterViewInit(): void {
    this.focusProductSearch(false);
  }

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
    if (this.selectedIndex >= 0 && this.selectedIndex < this.tickets.length) {
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
    this.loading = true;
    this.ticketsService.deleteTicket(ticket.id).subscribe({
      next: () => {
        const updated = [...this.tickets];
        updated.splice(index, 1);
        this.tickets = updated;
        if (this.tickets.length === 0) {
          this.selectedIndex = -1;
          this.currentReciboId = null;
        } else if (this.selectedIndex >= this.tickets.length) {
          this.selectedIndex = this.tickets.length - 1;
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
        } else if (this.selectedIndex === index) {
          this.selectedIndex = Math.max(0, index - 1);
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
        } else {
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
        }
        this.loading = false;
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
        this.tickets = resp || [];
        this.selectedIndex = this.tickets.length > 0 ? 0 : -1;
        if (this.selectedIndex >= 0) {
          this.fetchReciboForTicket(this.tickets[this.selectedIndex].id);
        } else {
          this.currentReciboId = null;
        }
        this.loading = false;
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
    this.ticketReciboService.getByTicketId(ticketId).subscribe({
      next: (relation) => {
        const nuevoReciboId = relation?.reciboId ?? null;
        if (forceReload && nuevoReciboId && this.currentReciboId === nuevoReciboId) {
          this.currentReciboId = null;
          setTimeout(() => {
            this.currentReciboId = nuevoReciboId;
            this.focusProductSearch(false);
          }, 0);
        } else {
          this.currentReciboId = nuevoReciboId;
          if (this.currentReciboId) {
            this.focusProductSearch(false);
          }
        }
      },
      error: (err) => {
        console.error('Error loading ticket recibo relation', err);
        this.currentReciboId = null;
      }
    });
  }
}


