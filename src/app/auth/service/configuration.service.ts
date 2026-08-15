import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConfigurationItem {
  id: number;
  key: string;
  value: string;
}

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
  if (raw == null) {
    return false;
  }
  const trimmed = String(raw).trim();
  if (!trimmed) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'si') {
    return true;
  }
  if (lower === 'false' || lower === '0' || lower === 'no') {
    return false;
  }
  try {
    const parsed = JSON.parse(trimmed) as { mostrar?: unknown };
    return parsed?.mostrar === true || parsed?.mostrar === 'true';
  } catch {
    return false;
  }
}
