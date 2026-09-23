import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface HistorialReciboDetalleDto {
  id: number;
  reciboId: number;
  productoId: number;
  cantidad: number;
  subtotal: number;
  producto?: {
    id: number;
    barcode: string;
    nombre: string;
    precio: number;
    precioCompra: number;
    foto: string | null;
    activate: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class HistorialReciboDetalleService {
  private apiUrl = `${environment.apiUrlRelationalDb}/historial-recibo-detalles`;

  constructor(private http: HttpClient) {}

  getDetallesByReciboId(reciboId: number): Observable<HistorialReciboDetalleDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    const params = new HttpParams().set('reciboId', String(reciboId));
    return this.http.get<HistorialReciboDetalleDto[]>(this.apiUrl, { headers, params });
  }
}

