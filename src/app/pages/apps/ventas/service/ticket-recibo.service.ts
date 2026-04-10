import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface TicketReciboDto {
  id: number;
  ticketId: number;
  reciboId: number;
}

@Injectable({
  providedIn: 'root'
})
export class TicketReciboService {
  private apiUrl = `${environment.apiUrlRelationalDb}/ticket-recibos`;

  constructor(private http: HttpClient) {}

  getByTicketId(
    ticketId: number,
    sessionId: number,
    reciboPadreId?: number
  ): Observable<TicketReciboDto | null> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    const query = reciboPadreId !== undefined && reciboPadreId !== null
      ? `?sessionId=${sessionId}&reciboPadreId=${reciboPadreId}`
      : `?sessionId=${sessionId}`;
    return this.http.get<TicketReciboDto | null>(`${this.apiUrl}/ticket/${ticketId}${query}`, {
      headers
    });
  }

  getByReciboId(reciboId: number): Observable<TicketReciboDto | null> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<TicketReciboDto | null>(`${this.apiUrl}/recibo/${reciboId}`, {
      headers
    });
  }
}



