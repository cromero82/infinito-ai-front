import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EgresoDto {
  id: number;
  fecha: string;
  valor: number;
  descripcion: string;
  proveedor: {
    id: number;
    nombre?: string;
    documento?: string;
    telefono?: string;
    correo?: string;
    tipoEgreso?: { id: number; nombre?: string; descripcion?: string };
  };
}

export interface CreateEgresoRequest {
  fecha: string;
  valor: number;
  descripcion: string;
  proveedor: { id: number };
}

export interface EgresoSearchParams {
  descripcion?: string;
  tipoEgresoId?: number;
  proveedorId?: number;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EgresosService {
  private apiUrl = 'http://localhost:8088/egresos';

  constructor(private http: HttpClient) {}

  searchEgresos(params: EgresoSearchParams): Observable<PageResponse<EgresoDto>> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    const httpParams = new HttpParams()
      .set('descripcion', params.descripcion ?? '')
      .set('tipoEgresoId', params.tipoEgresoId != null ? params.tipoEgresoId.toString() : '')
      .set('proveedorId', params.proveedorId != null ? params.proveedorId.toString() : '')
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 10).toString());

    return this.http.get<PageResponse<EgresoDto>>(`${this.apiUrl}/searchDescripciones`, { headers, params: httpParams });
  }

  createEgreso(egreso: CreateEgresoRequest): Observable<EgresoDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<EgresoDto>(this.apiUrl, egreso, { headers });
  }

  updateEgreso(id: number, egreso: CreateEgresoRequest): Observable<EgresoDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<EgresoDto>(`${this.apiUrl}/${id}`, egreso, { headers });
  }
}
