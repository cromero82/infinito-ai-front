import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface SesionDto {
  id: number;
  cookie: string;
  ultimoTicketId: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface CrearSesionRequest {
  cookie: string;
}

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  private apiUrl = `${environment.apiUrlRelationalDb}/sesiones`;

  constructor(private http: HttpClient) {}

  getSesionById(sessionId: number): Observable<SesionDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<SesionDto>(`${this.apiUrl}/${sessionId}`, { headers });
  }

  crearSesion(cookie: string): Observable<SesionDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const body: CrearSesionRequest = { cookie };
    return this.http.post<SesionDto>(this.apiUrl, body, { headers });
  }

  /**
   * Genera un cookie único para la sesión
   */
  generarCookieUnico(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Elimina una sesión (libera los registros)
   */
  deleteSesion(sessionId: number): Observable<void> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${sessionId}`, { headers });
  }

  /**
   * Obtiene todas las sesiones del usuario actual
   */
  getTodasLasSesionesUsuario(): Observable<SesionDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<SesionDto[]>(`${this.apiUrl}/usuario/todas`, { headers });
  }

  /**
   * Obtiene todos los registros del usuario actual, independiente del estado es_activo
   * Similar a findAll() pero filtrado por usuario
   */
  obtenerTodosPorUsuario(): Observable<SesionDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<SesionDto[]>(`${this.apiUrl}/usuario/todos`, { headers });
  }
}


