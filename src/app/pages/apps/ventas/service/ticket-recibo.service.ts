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

  getByTicketId(ticketId: number): Observable<TicketReciboDto> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<TicketReciboDto>(`${this.apiUrl}/ticket/${ticketId}`, { headers });
  }
}



