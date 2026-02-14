import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface TicketDto {
  id: number;
  sessionId: number;
  nombre: string;
  orden: number;
  fechaCreacion: string;
  reciboId?: number | null;
}

export interface TicketOrdenDto {
  id: number;
  sessionId: number;
  nombre: string;
  orden: number;
}

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private apiUrl = `${environment.apiUrlRelationalDb}/tickets`;

  constructor(private http: HttpClient) {}

  getTicketsBySession(sessionId: number): Observable<TicketDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<TicketDto[]>(`${this.apiUrl}/session/${sessionId}`, { headers });
  }

  createTicket(sessionId: number, nombre: string): Observable<TicketDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    const payload = { sessionId, nombre };
    return this.http.post<TicketDto>(this.apiUrl, payload, { headers });
  }

  deleteTicket(ticketId: number): Observable<void> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${ticketId}`, { headers });
  }

  updateTicketsOrder(tickets: TicketOrdenDto[]): Observable<TicketDto[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.put<TicketDto[]>(this.apiUrl, tickets, { headers });
  }
}


