import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { NgIf, NgFor } from '@angular/common';
import { ReciboComponent } from '../recibo/recibo.component';
import { environment } from '../../../../../environments/environment';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexBreadcrumbsComponent } from '@vex/components/vex-breadcrumbs/vex-breadcrumbs.component';

interface TicketDto {
  id: number;
  sessionId: number;
  nombre: string;
  fechaCreacion: string;
}

@Component({
  selector: 'vex-tickets-recibo',
  standalone: true,
  imports: [
    VexPageLayoutComponent,
    VexPageLayoutHeaderDirective,
    VexPageLayoutContentDirective,
    VexBreadcrumbsComponent,
    MatTabsModule,
    NgIf,
    NgFor,
    ReciboComponent
  ],
  templateUrl: './tickets-recibo.component.html',
  styleUrls: ['./tickets-recibo.component.scss']
})
export class TicketsReciboComponent implements OnInit {
  tickets: TicketDto[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('session-id');
    const sessionId = stored ? Number(stored) : NaN;
    if (!sessionId || Number.isNaN(sessionId)) {
      this.tickets = [];
      return;
    }

    const baseUrl = environment.apiUrlRelationalDb || 'http://localhost:8080';
    const url = `${baseUrl}/tickets/session/${sessionId}`;
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    this.http.get<TicketDto[]>(url, { headers }).subscribe({
      next: (resp) => (this.tickets = resp || []),
      error: () => (this.tickets = [])
    });
  }
}


