import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface EgresoDto {
  id: number;
  fecha: string;
  valor: number;
  descripcion: string;
  metodoPagoId?: number;
  origenFondosId?: number;
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
  metodoPagoId: number;
  origenFondosId: number;
  proveedor: { id: number };
}

export interface EgresoSearchParams {
  descripcion?: string;
  tipoEgresoId?: number;
  proveedorId?: number;
  fechaInicio?: string;
  fechaFin?: string;
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
  private apiUrl = `${environment.apiUrlRelationalDb}/egresos`;

  constructor(private http: HttpClient) {}

  searchEgresos(params: EgresoSearchParams): Observable<PageResponse<EgresoDto>> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 10).toString());

    if (params.descripcion) {
      httpParams = httpParams.set('descripcion', params.descripcion);
    }
    if (params.tipoEgresoId != null) {
      httpParams = httpParams.set('tipoEgresoId', params.tipoEgresoId.toString());
    }
    if (params.proveedorId != null) {
      httpParams = httpParams.set('proveedorId', params.proveedorId.toString());
    }
    if (params.fechaInicio) {
      httpParams = httpParams.set('fechaInicio', params.fechaInicio);
    }
    if (params.fechaFin) {
      httpParams = httpParams.set('fechaFin', params.fechaFin);
    }

    return this.http.get<PageResponse<EgresoDto>>(`${this.apiUrl}/search`, { headers, params: httpParams });
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

  eliminar(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  getEgresoById(id: number): Observable<EgresoDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<EgresoDto>(`${this.apiUrl}/${id}`, { headers });
  }
}
