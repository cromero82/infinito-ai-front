import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

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
  totalCobranzas?: number | null;
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

export interface EstadisticaFechaFiltro {
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface EstadisticaMesFiltro {
  mesInicio?: string | null;
  mesFin?: string | null;
}

export interface EstadisticaAnioFiltro {
  anioInicio?: string | null;
  anioFin?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EstadisticaFinancieraService {
  private apiUrl = `${environment.apiUrlRelationalDb}/estadistica-financiera`;

  constructor(private http: HttpClient) {}

  postRegistrar(request: ValorTiempoRequest): Observable<ProcesoEstadisticaResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<ProcesoEstadisticaResponse>(this.apiUrl, request, { headers });
  }

  putActualizar(request: ValorTiempoRequest): Observable<EstadisticaFinancieraPutResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<EstadisticaFinancieraPutResponse>(this.apiUrl, request, { headers });
  }

  private buildFechaParams(filtro?: EstadisticaFechaFiltro): HttpParams {
    let params = new HttpParams();
    if (filtro?.fechaInicio) {
      params = params.set('fechaInicio', filtro.fechaInicio);
    }
    if (filtro?.fechaFin) {
      params = params.set('fechaFin', filtro.fechaFin);
    }
    return params;
  }

  private buildMesParams(filtro?: EstadisticaMesFiltro): HttpParams {
    let params = new HttpParams();
    if (filtro?.mesInicio) {
      params = params.set('mesInicio', filtro.mesInicio);
    }
    if (filtro?.mesFin) {
      params = params.set('mesFin', filtro.mesFin);
    }
    return params;
  }

  private buildAnioParams(filtro?: EstadisticaAnioFiltro): HttpParams {
    let params = new HttpParams();
    if (filtro?.anioInicio) {
      params = params.set('anioInicio', filtro.anioInicio);
    }
    if (filtro?.anioFin) {
      params = params.set('anioFin', filtro.anioFin);
    }
    return params;
  }

  getDiaria(
    page = 0,
    size = 10,
    filtro?: EstadisticaFechaFiltro
  ): Observable<PageResponseEstadistica<EstadisticaFinancieraDiariaDto>> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = this.buildFechaParams(filtro).set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponseEstadistica<EstadisticaFinancieraDiariaDto>>(
      `${this.apiUrl}/diaria`,
      { headers, params }
    );
  }

  getMensual(filtro?: EstadisticaMesFiltro): Observable<EstadisticaFinancieraMensualDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = this.buildMesParams(filtro);
    return this.http.get<EstadisticaFinancieraMensualDto[]>(`${this.apiUrl}/mensual`, { headers, params });
  }

  getAnual(filtro?: EstadisticaAnioFiltro): Observable<EstadisticaFinancieraAnualDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = this.buildAnioParams(filtro);
    return this.http.get<EstadisticaFinancieraAnualDto[]>(`${this.apiUrl}/anual`, { headers, params });
  }
}
