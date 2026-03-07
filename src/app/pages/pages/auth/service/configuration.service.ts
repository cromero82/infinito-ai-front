import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface ConfigurationItem {
  id: number;
  key: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private apiUrl = 'http://localhost:8088/configuracion-app';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  obtenerTodasConfiguraciones(): Observable<ConfigurationItem[]> {
    const token = this.authService.getToken();
    
    if (!token) {
      return throwError(() => new Error('No hay token de autenticación'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ConfigurationItem[]>(`${this.apiUrl}/obtenerTodos`, { headers }).pipe(
      map(configuraciones => {
        for (const config of configuraciones) {
          if (config.key === 'longitud-vertical-panel-productos' && config.value) {
            localStorage.setItem('longitud-vertical-panel-productos', config.value);
          }
          if (config.key === 'alerta-precios' && config.value) {
            try {
              const parsed = JSON.parse(config.value) as { porcentaje_minimo?: number; porc_maximo?: number };
              if (parsed.porcentaje_minimo != null) {
                localStorage.setItem('alerta-precios-porcentaje-minimo', String(parsed.porcentaje_minimo));
              }
            } catch (e) {
              console.warn('Error al parsear alerta-precios:', e);
            }
          }
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

  /** Obtiene el porcentaje mínimo de ganancia desde localStorage (alerta-precios). Por defecto 5. */
  obtenerPorcentajeMinimoGanancia(): number {
    const val = localStorage.getItem('alerta-precios-porcentaje-minimo');
    if (val == null) return 5;
    const n = parseFloat(val);
    return Number.isNaN(n) ? 5 : n;
  }
}






