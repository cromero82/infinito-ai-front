import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ReciboDetalleDto {
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

export interface CreateReciboDetalleRequest {
  reciboId: number;
  productoId: number;
  cantidad: number;
  subtotal: number;
}

export interface UpdateReciboDetalleRequest {
  reciboId: number;
  productoId: number;
  cantidad: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReciboDetalleService {
  private apiUrl = `${environment.apiUrlRelationalDb}/recibo-detalles`;

  constructor(private http: HttpClient) {}

  getDetallesByRecibo(reciboId: number): Observable<ReciboDetalleDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<ReciboDetalleDto[]>(`${this.apiUrl}/recibo/${reciboId}`, { headers });
  }

  createDetalle(payload: CreateReciboDetalleRequest): Observable<ReciboDetalleDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.post<ReciboDetalleDto>(this.apiUrl, payload, { headers });
  }

  updateDetalle(
    detalleId: number,
    payload: UpdateReciboDetalleRequest
  ): Observable<ReciboDetalleDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.put<ReciboDetalleDto>(`${this.apiUrl}/${detalleId}`, payload, {
      headers
    });
  }

  deleteDetalle(detalleId: number): Observable<void> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${detalleId}`, { headers });
  }
}


