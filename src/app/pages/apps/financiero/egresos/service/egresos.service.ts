import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { NaturalezaEgreso } from '../util/naturaleza-egreso.util';

export interface EgresoOrigenDto {
  id?: number;
  origenFondosId: number;
  metodoPagoId?: number | null;
  valor: number;
  orden?: number;
}

export interface EgresoDto {
  id: number;
  fecha: string;
  valor: number;
  descripcion: string;
  metodoPagoId?: number;
  origenFondosId?: number;
  origenes?: EgresoOrigenDto[];
  fromMovimientoOrigenFondosId?: number | null;
  notificacionEmailPagoId?: number | null;
  naturaleza?: NaturalezaEgreso | string | null;
  tipoEgreso?: {
    id: number;
    nombre?: string;
    descripcion?: string;
    naturaleza?: { id?: number; codigo?: string; nombre?: string } | null;
  } | null;
  proveedor?: {
    id: number;
    nombre?: string;
    documento?: string;
    telefono?: string;
    correo?: string;
    tipoEgreso?: {
      id: number;
      nombre?: string;
      descripcion?: string;
      naturaleza?: { id?: number; codigo?: string; nombre?: string } | null;
    };
  } | null;
  persona?: {
    id: number;
    documento?: string;
    nombre?: string;
    telefono?: string | null;
    correo?: string | null;
    activo?: boolean;
    esDuenoPropietario?: boolean;
  } | null;
}

export interface CreateEgresoRequest {
  fecha: string;
  valor: number;
  descripcion: string;
  /** Opcional: derivado del O.F.; ausente en cuentas sin medio (Caja Menor/General). */
  metodoPagoId?: number | null;
  origenFondosId: number;
  origenes: EgresoOrigenDto[];
  proveedor?: { id: number } | null;
  persona?: { id: number } | null;
  tipoEgreso?: { id: number };
  naturaleza?: NaturalezaEgreso | string;
  /**
   * Formalizar egreso: movimiento «por identificar» (p.ej. en Sin Clasificar).
   * El BE fuerza origen = OF del movimiento (sin restar de nuevo el banco).
   */
  fromMovimientoOrigenFondosId?: number | null;
}

/** Prefill al abrir Nuevo egreso desde un movimiento OF por identificar. */
export interface FormalizarEgresoDialogData {
  mode: 'formalizar';
  fromMovimientoOrigenFondosId: number;
  origenFondosId: number;
  valor: number;
  terceroNombre?: string | null;
  idReferencia?: number | null;
}

export type EgresoEditDialogData = EgresoDto | FormalizarEgresoDialogData | null;

export interface EgresoSearchParams {
  descripcion?: string;
  tipoEgresoId?: number;
  naturaleza?: string;
  proveedorId?: number;
  personaId?: number;
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
    const headers = new HttpHeaders({ Accept: 'application/json' });
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 10).toString());

    if (params.descripcion) {
      httpParams = httpParams.set('descripcion', params.descripcion);
    }
    if (params.tipoEgresoId != null) {
      httpParams = httpParams.set('tipoEgresoId', params.tipoEgresoId.toString());
    }
    if (params.naturaleza) {
      httpParams = httpParams.set('naturaleza', params.naturaleza);
    }
    if (params.proveedorId != null) {
      httpParams = httpParams.set('proveedorId', params.proveedorId.toString());
    }
    if (params.personaId != null) {
      httpParams = httpParams.set('personaId', params.personaId.toString());
    }
    if (params.fechaInicio) {
      httpParams = httpParams.set('fechaInicio', params.fechaInicio);
    }
    if (params.fechaFin) {
      httpParams = httpParams.set('fechaFin', params.fechaFin);
    }

    return this.http.get<PageResponse<EgresoDto>>(`${this.apiUrl}/search`, {
      headers,
      params: httpParams
    });
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
