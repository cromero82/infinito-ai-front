import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface UsuarioPerfil {
  id: number;
  personalizacion: any;
  usuarioId: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioPerfilService {
  private apiUrl = 'http://localhost:8088/usuario-perfil';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtiene el perfil del usuario (array con un objeto) y devuelve su contenido.
   */
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
}
