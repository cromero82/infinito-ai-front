import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface QuickReciboRequest {
  clienteId: number;
  metodoPagoId: number;
  sesionId: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialReciboService {
  private apiUrl = `${environment.apiUrlRelationalDb}/historial-recibos`;

  constructor(private http: HttpClient) {}

  addQuickRecibo(payload: QuickReciboRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.post<any>(`${this.apiUrl}/addquickRecibo`, payload, { headers });
  }
}

