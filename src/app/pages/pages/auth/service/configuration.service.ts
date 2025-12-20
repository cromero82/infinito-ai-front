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
        // Filtrar la configuración específica
        const config = configuraciones.find(c => c.key === 'longitud-vertical-panel-productos');
        
        if (config && config.value) {
          // Guardar en localStorage
          localStorage.setItem('longitud-vertical-panel-productos', config.value);
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
}

