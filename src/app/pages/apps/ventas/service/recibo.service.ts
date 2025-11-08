import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ReciboDto {
  id: number;
  clienteId: number;
  cliente: {
    id: number;
    nombre: string;
    telefono: string;
    documento: string;
  };
  fechaCreacion: string;
  estadoId: number;
  estado: string;
  metodoPagoId: number | null;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private apiUrl = `${environment.apiUrlRelationalDb}/recibos`;

  constructor(private http: HttpClient) {}

  getRecibo(reciboId: number): Observable<ReciboDto> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<ReciboDto>(`${this.apiUrl}/${reciboId}`, { headers });
  }
}



