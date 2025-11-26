import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface SesionDto {
  id: number;
  cookie: string;
  ultimoTicketId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  private apiUrl = `${environment.apiUrlRelationalDb}/sesiones`;

  constructor(private http: HttpClient) {}

  getSesionById(sessionId: number): Observable<SesionDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<SesionDto>(`${this.apiUrl}/${sessionId}`, { headers });
  }
}


