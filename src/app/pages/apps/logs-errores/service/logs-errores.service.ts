import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface LogsQueryParams {
  from?: string;
  to?: string;
  limit?: number;
}

/** Fila genérica devuelta por Influx u otro backend (campos variables). */
export type LogInfluxRow = Record<string, unknown>;

function buildParams(params?: LogsQueryParams): HttpParams {
  let httpParams = new HttpParams();
  if (!params) return httpParams;
  if (params.from) httpParams = httpParams.set('from', params.from);
  if (params.to) httpParams = httpParams.set('to', params.to);
  if (params.limit != null && params.limit > 0) {
    httpParams = httpParams.set('limit', String(params.limit));
  }
  return httpParams;
}

/**
 * Normaliza la respuesta del GET /logs/* a un arreglo de filas.
 * Soporta cuerpo en array plano o envuelto en propiedades habituales.
 */
export function extractLogRows(body: unknown): LogInfluxRow[] {
  if (body == null) return [];
  if (Array.isArray(body)) return body as LogInfluxRow[];
  if (typeof body !== 'object') return [];
  const o = body as Record<string, unknown>;
  const keys = ['records', 'data', 'content', 'logs', 'rows', 'items', 'values', 'results'];
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v as LogInfluxRow[];
  }
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class LogsErroresService {
  private readonly baseUrl = `${environment.apiUrlRelationalDb}/api/v1/logs`;

  constructor(private readonly http: HttpClient) {}

  getBackendLogs(params?: LogsQueryParams): Observable<LogInfluxRow[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const httpParams = buildParams(params);
    return this.http
      .get<unknown>(`${this.baseUrl}/backend`, { headers, params: httpParams })
      .pipe(map(extractLogRows));
  }

  getFrontendLogs(params?: LogsQueryParams): Observable<LogInfluxRow[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const httpParams = buildParams(params);
    return this.http
      .get<unknown>(`${this.baseUrl}/frontend`, { headers, params: httpParams })
      .pipe(map(extractLogRows));
  }
}
