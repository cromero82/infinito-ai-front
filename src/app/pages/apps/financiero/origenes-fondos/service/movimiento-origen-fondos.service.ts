import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface MovimientoOrigenFondosDto {
  id: number;
  fecha: string;
  usuarioId?: string;
  origenFondosId: number;
  origenFondosNombre?: string;
  origenDestinoId?: number | null;
  origenDestinoNombre?: string | null;
  tipoMovimiento: string;
  valor: number;
  impacto?: number;
  saldoAntes?: number;
  saldoDespues?: number;
  metodoPagoId?: number | null;
  terceroNombre?: string | null;
  motivoMovimientoId?: number | null;
  motivoMovimientoNombre?: string | null;
  observacion?: string | null;
  valorSistema?: number | null;
  valorReal?: number | null;
  origenTipo?: string | null;
  /** Id egreso / corte_venta / etc. según origenTipo. */
  idReferencia?: number | null;
  /** @deprecated usar idReferencia */
  origenId?: number | null;
  grupoTrasladoId?: string | null;
  /** CUENTA_PERSONAL | ANTICIPO_SALARIO | VALE_EMPLEADO | GASTO_NEGOCIO | OTRO_LEGALIZADO */
  clasificacionOperativa?: string | null;
  periodoCierreId?: number | null;
}

export interface MovimientoEntradaRequest {
  origenFondosId: number;
  valor: number;
  fecha: string;
  observacion?: string;
  motivoMovimientoId?: number;
}

export interface MovimientoPrestamoRequest {
  origenFondosId: number;
  valor: number;
  fecha: string;
  terceroNombre: string;
  observacion?: string;
}

export interface MovimientoTrasladoRequest {
  origenFondosId: number;
  origenDestinoId: number;
  valor: number;
  fecha: string;
  observacion?: string;
  /** CUENTA_PERSONAL | ANTICIPO_SALARIO | VALE_EMPLEADO | GASTO_NEGOCIO | OTRO_LEGALIZADO */
  clasificacionOperativa?: string | null;
}

export interface MovimientoAjusteRequest {
  origenFondosId: number;
  valorSistema: number;
  valorReal: number;
  fecha: string;
  motivoMovimientoId?: number;
  observacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoOrigenFondosService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/movimientos-origen-fondos`;

  constructor(private http: HttpClient) {}

  findByCuenta(origenFondosId: number): Observable<MovimientoOrigenFondosDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = new HttpParams().set('origenFondosId', String(origenFondosId));
    return this.http.get<MovimientoOrigenFondosDto[]>(this.apiUrl, { headers, params });
  }

  /** Ambas patas de un traslado/distribución (orden id ASC). */
  findByGrupoTrasladoId(grupoTrasladoId: string): Observable<MovimientoOrigenFondosDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<MovimientoOrigenFondosDto[]>(
      `${this.apiUrl}/grupo/${encodeURIComponent(grupoTrasladoId)}`,
      { headers }
    );
  }

  /**
   * Movimientos «por identificar» en bolsas, mismo valor, sin egreso vinculado.
   */
  findCandidatosFormalizarEgreso(
    origenFondosIds: number[],
    valor: number
  ): Observable<MovimientoOrigenFondosDto[]> {
    if (!origenFondosIds.length || !(valor > 0)) {
      return of([]);
    }
    const headers = new HttpHeaders({ Accept: 'application/json' });
    let params = new HttpParams().set('valor', String(valor));
    for (const id of origenFondosIds) {
      params = params.append('origenFondosIds', String(id));
    }
    return this.http.get<MovimientoOrigenFondosDto[]>(
      `${this.apiUrl}/candidatos-formalizar-egreso`,
      { headers, params }
    );
  }

  /**
   * Reporte operativo: piernas con impacto &gt; 0 y clasificación no nula.
   */
  findPorClasificacion(
    desde: string,
    hasta: string,
    clasificacionOperativa?: string
  ): Observable<MovimientoOrigenFondosDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (clasificacionOperativa) {
      params = params.set('clasificacionOperativa', clasificacionOperativa);
    }
    return this.http.get<MovimientoOrigenFondosDto[]>(
      `${this.apiUrl}/por-clasificacion`,
      { headers, params }
    );
  }

  entradaManual(payload: MovimientoEntradaRequest): Observable<MovimientoOrigenFondosDto> {
    return this.postJson('/entrada-manual', payload);
  }

  prestamo(payload: MovimientoPrestamoRequest): Observable<MovimientoOrigenFondosDto> {
    return this.postJson('/prestamo', payload);
  }

  traslado(payload: MovimientoTrasladoRequest): Observable<MovimientoOrigenFondosDto[]> {
    return this.postJson('/traslado', payload);
  }

  ajuste(payload: MovimientoAjusteRequest): Observable<MovimientoOrigenFondosDto> {
    return this.postJson('/ajuste', payload);
  }

  private postJson<T>(path: string, body: unknown): Observable<T> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.post<T>(`${this.apiUrl}${path}`, body, { headers });
  }
}
