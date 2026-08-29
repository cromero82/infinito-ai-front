import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export type CodigoPresentacion = 'PAQUETE' | 'UNIDAD' | string;

export interface ProductoPresentacionDto {
  id: number;
  productoId: number;
  codigo: CodigoPresentacion;
  nombreMostrar: string;
  factorABase: number;
  precioVenta: number;
  codigoBarrasAlt?: string | null;
  esDefaultVenta?: boolean;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductoPresentacionService {
  private base = `${environment.apiUrlRelationalDb}`;

  constructor(private http: HttpClient) {}

  listByProducto(
    productoId: number,
    soloActivos = true
  ): Observable<ProductoPresentacionDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = new HttpParams().set('soloActivos', String(soloActivos));
    return this.http.get<ProductoPresentacionDto[]>(
      `${this.base}/products/${productoId}/presentaciones`,
      { headers, params }
    );
  }

  ensure(productoId: number): Observable<ProductoPresentacionDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.post<ProductoPresentacionDto[]>(
      `${this.base}/products/${productoId}/presentaciones/ensure`,
      {},
      { headers }
    );
  }

  create(
    productoId: number,
    body: Partial<ProductoPresentacionDto>
  ): Observable<ProductoPresentacionDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.post<ProductoPresentacionDto>(
      `${this.base}/products/${productoId}/presentaciones`,
      body,
      { headers }
    );
  }

  update(
    id: number,
    body: Partial<ProductoPresentacionDto>
  ): Observable<ProductoPresentacionDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.put<ProductoPresentacionDto>(
      `${this.base}/producto-presentaciones/${id}`,
      body,
      { headers }
    );
  }

  softDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/producto-presentaciones/${id}`);
  }
}
