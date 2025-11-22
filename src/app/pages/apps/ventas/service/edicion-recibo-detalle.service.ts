import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface EdicionReciboDetalleDto {
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
export class EdicionReciboDetalleService {
  private apiUrl = `${environment.apiUrlRelationalDb}/edicion-recibo-detalles`;

  constructor(private http: HttpClient) {}

  getEdicionReciboDetalles(reciboId: number): Observable<EdicionReciboDetalleDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    const params = new HttpParams().set('reciboId', String(reciboId));
    return this.http.get<EdicionReciboDetalleDto[]>(this.apiUrl, { headers, params });
  }
}

