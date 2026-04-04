import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoResultadoFinDto {
  id: number;
  sigla: string;
  descripcion: string;
  /** Color hex para indicador (ej. #808080) */
  color?: string;
}

export interface EstadisticaFinancieraBaseDto {
  id: number;
  fechaCreacion: string;
  totalEgresos: number | null;
  totalVentas: number | null;
  utilidad: number | null;
  porcentajeUtilidad: number | null;
  valorTiempo: string;
  tipoResultadoFin: TipoResultadoFinDto | null;
}

export interface EstadisticaFinancieraDiariaDto extends EstadisticaFinancieraBaseDto {
  dia: string;
}

export interface EstadisticaFinancieraMensualDto extends EstadisticaFinancieraBaseDto {
  mes: string;
}

export interface EstadisticaFinancieraAnualDto extends EstadisticaFinancieraBaseDto {
  anio: string;
}

export interface PageResponseEstadistica<T> {
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

export interface ProcesoEstadisticaResponse {
  mensaje: string;
}

/** Respuesta del PUT: registro actualizado (misma forma base + campos de período opcionales) */
export interface EstadisticaFinancieraPutResponse extends EstadisticaFinancieraBaseDto {
  formatoTiempo?: string;
  dia?: string;
  mes?: string;
  anio?: string;
}

export interface ValorTiempoRequest {
  valorTiempo: string;
}

@Injectable({ providedIn: 'root' })
export class EstadisticaFinancieraService {
  private apiUrl = 'http://localhost:8088/estadistica-financiera';

  constructor(private http: HttpClient) {}

  postRegistrar(request: ValorTiempoRequest): Observable<ProcesoEstadisticaResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<ProcesoEstadisticaResponse>(this.apiUrl, request, { headers });
  }

  putActualizar(request: ValorTiempoRequest): Observable<EstadisticaFinancieraPutResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<EstadisticaFinancieraPutResponse>(this.apiUrl, request, { headers });
  }

  getDiaria(page = 0, size = 10): Observable<PageResponseEstadistica<EstadisticaFinancieraDiariaDto>> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponseEstadistica<EstadisticaFinancieraDiariaDto>>(
      `${this.apiUrl}/diaria`,
      { headers, params }
    );
  }

  getMensual(): Observable<EstadisticaFinancieraMensualDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<EstadisticaFinancieraMensualDto[]>(`${this.apiUrl}/mensual`, { headers });
  }

  getAnual(): Observable<EstadisticaFinancieraAnualDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<EstadisticaFinancieraAnualDto[]>(`${this.apiUrl}/anual`, { headers });
  }
}
