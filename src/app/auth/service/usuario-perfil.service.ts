import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface UsuarioPerfil {
  id: number;
  personalizacion: any;
  usuarioId: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioPerfilService {
  private apiUrl = `${environment.apiUrlRelationalDb}/usuario-perfil`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getMyProfile(): Observable<UsuarioPerfil[]> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No hay token de autenticación'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<UsuarioPerfil[]>(`${this.apiUrl}/mi-perfil`, { headers }).pipe(
      catchError(error => {
        console.error('Error al obtener perfil de usuario:', error);
        return throwError(() => error);
      })
    );
  }

  updatePersonalizacion(personalizacion: Record<string, unknown>): Observable<UsuarioPerfil> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No hay token de autenticación'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.getMyProfile().pipe(
      switchMap(profiles => {
        if (!profiles || profiles.length === 0) {
          return throwError(() => new Error('No se encontró el perfil del usuario'));
        }
        const profileId = profiles[0].id;
        return this.http.put<UsuarioPerfil>(`${this.apiUrl}/${profileId}`, { personalizacion }, { headers });
      }),
      catchError(error => {
        console.error('Error al actualizar personalización:', error);
        return throwError(() => error);
      })
    );
  }
}
