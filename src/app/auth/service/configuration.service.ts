import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ConfigurationItem {
  id: number;
  key: string;
  value: string;
}

/** Key en configuracion_app + localStorage: panel Pagos electrónicos. */
export const KEY_NOTIFICACIONES_ACTIVA = 'notificaciones.activa';

/** Base de caja sugerida para el asistente de cierre (efectivo). */
export const KEY_CORTE_VENTA_BASE_EFECTIVO = 'corte-venta.base-efectivo';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private apiUrl = `${environment.apiUrlRelationalDb}/configuracion-app`;

  constructor(private http: HttpClient) {}

  obtenerTodasConfiguraciones(): Observable<ConfigurationItem[]> {
    return this.http.get<ConfigurationItem[]>(`${this.apiUrl}/obtenerTodos`).pipe(
      map(configuraciones => {
        let monitorBugSeen = false;
        let notificacionesActivaSeen = false;
        for (const config of configuraciones) {
          if (config.key === 'longitud-vertical-panel-productos' && config.value) {
            localStorage.setItem('longitud-vertical-panel-productos', config.value);
          }
          if (config.key === 'monitor-bug') {
            monitorBugSeen = true;
            localStorage.setItem(
              'monitor-bug',
              parseMonitorBugEnabled(config.value) ? 'true' : 'false'
            );
          }
          if (config.key === KEY_NOTIFICACIONES_ACTIVA) {
            notificacionesActivaSeen = true;
            localStorage.setItem(
              KEY_NOTIFICACIONES_ACTIVA,
              parseBoolConfig(config.value, true) ? 'true' : 'false'
            );
          }
          if (config.key === 'alerta-precios' && config.value) {
            try {
              const parsed = JSON.parse(config.value) as { porcentaje_minimo?: number; porc_maximo?: number };
              if (parsed.porcentaje_minimo != null) {
                localStorage.setItem('alerta-precios-porcentaje-minimo', String(parsed.porcentaje_minimo));
              }
              if (parsed.porc_maximo != null) {
                localStorage.setItem('alerta-precios-porcentaje-maximo', String(parsed.porc_maximo));
              }
            } catch (e) {
              console.warn('Error al parsear alerta-precios:', e);
            }
          }
        }
        if (!monitorBugSeen) {
          localStorage.setItem('monitor-bug', 'false');
        }
        if (!notificacionesActivaSeen) {
          localStorage.setItem(KEY_NOTIFICACIONES_ACTIVA, 'true');
        }
        return configuraciones;
      }),
      catchError(error => {
        console.error('Error al obtener configuraciones:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerLongitudPanelProductos(): string | null {
    return localStorage.getItem('longitud-vertical-panel-productos');
  }

  obtenerPorcentajeMinimoGanancia(): number {
    const val = localStorage.getItem('alerta-precios-porcentaje-minimo');
    if (val == null) return 5;
    const n = parseFloat(val);
    return Number.isNaN(n) ? 5 : n;
  }

  obtenerPorcentajeMaximoGanancia(): number {
    const val = localStorage.getItem('alerta-precios-porcentaje-maximo');
    if (val == null) return 80;
    const n = parseFloat(val);
    return Number.isNaN(n) ? 80 : n;
  }

  /** `monitor-bug=true` en configuracion-app → muestra el icono Monitor. */
  isMonitorBugEnabled(): boolean {
    return localStorage.getItem('monitor-bug') === 'true';
  }

  /**
   * Visibilidad del panel flotante Pagos electrónicos.
   * Default true. No afecta match/inbound en puente-tienda (solo UI).
   * Fuente: configuracion_app.key = notificaciones.activa (cargada al login).
   */
  isNotificacionesActivas(): boolean {
    const raw = localStorage.getItem(KEY_NOTIFICACIONES_ACTIVA);
    if (raw == null) {
      return true;
    }
    return parseBoolConfig(raw, true);
  }

  setNotificacionesActivasLocal(activa: boolean): void {
    localStorage.setItem(KEY_NOTIFICACIONES_ACTIVA, activa ? 'true' : 'false');
  }

  /** Valor crudo de una key en configuracion_app (GET obtenerTodos). */
  obtenerValorPorKey(key: string): Observable<string | null> {
    return this.obtenerTodasConfiguraciones().pipe(
      map((items) => items.find((c) => c.key === key)?.value ?? null)
    );
  }

  /** Pesos enteros de `corte-venta.base-efectivo`. Si no existe o no parsea, 0. */
  obtenerBaseEfectivoSugerida(): Observable<{
    valor: number;
    encontrada: boolean;
  }> {
    return this.obtenerValorPorKey(KEY_CORTE_VENTA_BASE_EFECTIVO).pipe(
      map((raw) => ({
        valor: parsePesosConfig(raw),
        encontrada: raw != null && String(raw).trim() !== ''
      })),
      catchError(() => of({ valor: 0, encontrada: false }))
    );
  }

  actualizarPorKey(key: string, value: string): Observable<ConfigurationItem> {
    return this.http.put<ConfigurationItem>(`${this.apiUrl}/key/${key}`, { value }).pipe(
      catchError(error => {
        console.error('Error al actualizar configuración:', error);
        return throwError(() => error);
      })
    );
  }
}

/** Acepta `true` / `"true"` o JSON `{"mostrar":true}` (formato en BD). */
function parseMonitorBugEnabled(raw: string | null | undefined): boolean {
  return parseBoolConfig(raw, false);
}

function parsePesosConfig(raw: string | null | undefined): number {
  if (raw == null) {
    return 0;
  }
  const trimmed = String(raw).trim();
  if (!trimmed) {
    return 0;
  }
  const digits = trimmed.replace(/[^\d-]/g, '');
  if (!digits || digits === '-') {
    return 0;
  }
  const n = Number(digits);
  return Number.isFinite(n) ? Math.round(Math.abs(n)) : 0;
}

function parseBoolConfig(raw: string | null | undefined, defaultValue: boolean): boolean {
  if (raw == null) {
    return defaultValue;
  }
  const trimmed = String(raw).trim();
  if (!trimmed) {
    return defaultValue;
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'si') {
    return true;
  }
  if (lower === 'false' || lower === '0' || lower === 'no') {
    return false;
  }
  try {
    const parsed = JSON.parse(trimmed) as { mostrar?: unknown; activa?: unknown };
    if (parsed?.mostrar === true || parsed?.mostrar === 'true') {
      return true;
    }
    if (parsed?.activa === true || parsed?.activa === 'true') {
      return true;
    }
    if (parsed?.mostrar === false || parsed?.activa === false) {
      return false;
    }
  } catch {
    /* ignore */
  }
  return defaultValue;
}
