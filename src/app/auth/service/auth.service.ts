import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  correoElectronico: string;
  contrasena: string;
}

export interface RegistroRequest {
  nombre: string;
  correoElectronico: string;
  contrasena: string;
  telefono: string;
}

export interface ActualizarUsuarioRequest {
  nombre?: string;
  telefono?: string;
  contrasena?: string;
  correoElectronico?: string;
}

export interface AuthResponse {
  token: string;
}

export interface JwtPayload {
  roles: string[] | Array<{ sigla: string; nombre: string }>;
  telefono: string;
  nombre: string;
  jti: string;
  sub: string;
  iat: number;
  exp: number;
}

export interface UsuarioAuthRol {
  id: number;
  nombre: string;
  sigla: string;
}

export interface UsuarioAuthDto {
  id: string;
  nombre: string;
  correoElectronico: string;
  telefono: string;
  activo: boolean;
  roles: UsuarioAuthRol[];
}

export interface UsuarioCacheDto {
  id: string;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly todosUsuariosStorageKey = 'todos-usuarios';
  private urlService = environment.apiUrlAuth;
  private servicePath = '/auth';
  private apiUrl = `${this.urlService}${this.servicePath}`;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' }).pipe(
      map((response: string) => {
        console.log('Respuesta del servidor (texto):', response);
        console.log('Tipo de respuesta:', typeof response);

        let token: string | undefined;

        if (!response || response.trim() === '') {
          throw new Error('Respuesta vacía del servidor');
        }

        try {
          const parsed = JSON.parse(response);
          if (parsed && typeof parsed === 'object') {
            token = parsed.token ||
                    parsed.accessToken ||
                    parsed.access_token ||
                    parsed.data?.token ||
                    parsed.data?.accessToken;
          }
        } catch (e) {
          token = response.trim();
        }

        if (!token || token.trim() === '') {
          console.error('No se pudo extraer el token de la respuesta:', response);
          throw new Error('Token no recibido del servidor');
        }

        console.log('Token extraído exitosamente, longitud:', token.length);
        return { token };
      }),
      tap(response => {
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Inicia una sesión de invitado (sin credenciales) contra POST /auth/login-guest.
   * El servidor devuelve un token genérico que se almacena igual que un login normal.
   * El nombre mostrado se fuerza a "INVITADO" porque el token de invitado no trae perfil.
   */
  loginGuest(): Observable<AuthResponse> {
    return this.http
      .post(`${this.apiUrl}/login-guest`, {}, { responseType: 'text' })
      .pipe(
        map((response: string) => {
          if (!response || response.trim() === '') {
            throw new Error('Respuesta vacía del servidor');
          }

          let token: string | undefined;
          try {
            const parsed = JSON.parse(response);
            if (parsed && typeof parsed === 'object') {
              token =
                parsed.token || parsed.accessToken || parsed.access_token;
            } else {
              token = response.trim();
            }
          } catch {
            token = response.trim();
          }

          if (!token || token.trim() === '') {
            throw new Error('Token no recibido del servidor');
          }

          return { token };
        }),
        tap((response) => {
          this.handleAuthResponse(response);
          localStorage.setItem('user-nombre', 'INVITADO');
        }),
        catchError((error) => {
          console.error('Error en login de invitado:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Invalida la sesión actual en el servidor (POST /auth/logout).
   * No falla la cadena si el servidor responde con error: limpiar la sesión local igualmente.
   */
  cerrarSesionServidor(): Observable<void> {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { responseType: 'text' })
      .pipe(
        map(() => undefined),
        catchError((error) => {
          console.warn('No se pudo cerrar la sesión en el servidor:', error);
          return of(undefined);
        })
      );
  }

  registro(datos: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse | string>(`${this.apiUrl}/registro`, datos).pipe(
      map(response => {
        let token: string;

        if (typeof response === 'string') {
          token = response;
        } else if (response && typeof response === 'object' && 'token' in response) {
          token = response.token;
        } else {
          console.warn('Formato de respuesta inesperado:', response);
          throw new Error('Formato de respuesta del servidor no válido');
        }

        if (!token || token.trim() === '') {
          throw new Error('Token no recibido del servidor');
        }

        return { token };
      }),
      tap(response => {
        try {
          this.handleAuthResponse(response);
        } catch (error) {
          console.error('Error al procesar respuesta de autenticación:', error);
          throw error;
        }
      }),
      catchError(error => {
        console.error('Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('user-token', response.token);

    try {
      const payload = this.decodeJwt(response.token);

      if (payload.nombre) {
        localStorage.setItem('user-nombre', payload.nombre);
      }
      if (payload.roles && Array.isArray(payload.roles)) {
        let rolesToStore: string[];
        if (payload.roles.length > 0 && typeof payload.roles[0] === 'object') {
          rolesToStore = (payload.roles as Array<{ sigla: string; nombre: string }>).map(r => r.sigla || r.nombre);

          const primerRol = payload.roles[0] as { sigla: string; nombre: string };
          if (primerRol.nombre) {
            localStorage.setItem('user-rol-nombre', primerRol.nombre);
          }
        } else {
          rolesToStore = payload.roles as string[];
          if (rolesToStore.length > 0) {
            localStorage.setItem('user-rol-nombre', rolesToStore[0]);
          }
        }
        localStorage.setItem('user-roles', JSON.stringify(rolesToStore));
      }
    } catch (error) {
      console.warn('Advertencia: No se pudo decodificar el JWT completamente:', error);
      console.log('El token se ha guardado en localStorage de todas formas');
    }
  }

  private decodeJwt(token: string): JwtPayload {
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Token JWT inválido: token vacío o no es un string');
      }

      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        throw new Error(`Token JWT inválido: debe tener 3 partes separadas por puntos, pero tiene ${parts.length}`);
      }

      const payloadEncoded = parts[1];

      if (!payloadEncoded || payloadEncoded.trim() === '') {
        throw new Error('Token JWT inválido: payload vacío');
      }

      let base64 = payloadEncoded.replace(/-/g, '+').replace(/_/g, '/');
      const paddingLength = (4 - base64.length % 4) % 4;
      const padded = base64 + '='.repeat(paddingLength);

      let decoded: string;
      try {
        decoded = atob(padded);
      } catch (e) {
        throw new Error(`Error al decodificar base64: ${e}. Base64: ${padded.substring(0, 50)}...`);
      }

      if (!decoded || decoded.trim() === '') {
        throw new Error('Token JWT inválido: payload decodificado está vacío');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(decoded);
        console.log('JWT decodificado exitosamente:', parsed);
      } catch (e) {
        throw new Error(`Error al parsear JSON del payload: ${e}. Payload decodificado: ${decoded}`);
      }

      return parsed as JwtPayload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error detallado al decodificar JWT:', {
        error: errorMessage,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 50) + '...' : 'null',
        tokenParts: token ? token.split('.').length : 0
      });
      throw new Error(`Error al decodificar JWT: ${errorMessage}`);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('user-token');
  }

  getNombre(): string | null {
    return localStorage.getItem('user-nombre');
  }

  getRoles(): string[] {
    const rolesStr = localStorage.getItem('user-roles');
    if (rolesStr) {
      try {
        return JSON.parse(rolesStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  getRolNombre(): string | null {
    return localStorage.getItem('user-rol-nombre');
  }

  isAdmin(): boolean {
    const roles = this.getRoles();
    if (roles.length > 0) {
      return roles.some(rol => rol && rol.toLowerCase() === 'admin');
    }

    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeJwt(token);
        if (payload.roles && Array.isArray(payload.roles)) {
          if (payload.roles.length > 0 && typeof payload.roles[0] === 'object') {
            const rolesArray = payload.roles as Array<{ sigla: string; nombre: string }>;
            return rolesArray.some(rol => rol.sigla && rol.sigla.toLowerCase() === 'admin');
          } else {
            const rolesArray = payload.roles as string[];
            return rolesArray.some(rol => rol && rol.toLowerCase() === 'admin');
          }
        }
      } catch (error) {
        console.warn('Error al decodificar token para verificar rol admin:', error);
      }
    }

    return false;
  }

  logout(preserveReloginState = false): void {
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-nombre');
    localStorage.removeItem('user-roles');
    localStorage.removeItem('user-rol-nombre');

    if (!preserveReloginState) {
      localStorage.removeItem('url-previous-relogin');
      localStorage.removeItem('user-previous-relogin');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  restaurarContrasena(correoElectronico: string): Observable<any> {
    const params = new HttpParams().set('correoElectronico', correoElectronico);

    return this.http.post(`${this.apiUrl}/restaurar-contrasena`, {}, {
      params,
      responseType: 'text'
    }).pipe(
      map((response: string) => {
        try {
          return JSON.parse(response);
        } catch {
          return { message: response || 'Solicitud procesada correctamente' };
        }
      }),
      catchError(error => {
        console.error('Error al restaurar contraseña:', error);
        return throwError(() => error);
      })
    );
  }

  actualizarUsuario(datos: ActualizarUsuarioRequest): Observable<any> {
    const camposPresentes = Object.keys(datos).filter(key => datos[key as keyof ActualizarUsuarioRequest] !== undefined && datos[key as keyof ActualizarUsuarioRequest] !== null && datos[key as keyof ActualizarUsuarioRequest] !== '');

    if (camposPresentes.length === 0) {
      return throwError(() => new Error('Debe enviar al menos un campo para actualizar'));
    }

    const datosAEnviar: any = {};
    camposPresentes.forEach(key => {
      datosAEnviar[key] = datos[key as keyof ActualizarUsuarioRequest];
    });

    return this.http.put(`${this.apiUrl}/actualizar-usuario`, datosAEnviar, {
      responseType: 'text'
    }).pipe(
      map((response: string) => {
        try {
          return JSON.parse(response);
        } catch {
          return { message: response || 'Usuario actualizado correctamente' };
        }
      }),
      catchError(error => {
        console.error('Error al actualizar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerUsuarios(): Observable<UsuarioAuthDto[]> {
    return this.http.get<UsuarioAuthDto[]>(`${this.apiUrl}/usuarios`).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerTodosUsuariosCache(): UsuarioCacheDto[] {
    const raw = localStorage.getItem(this.todosUsuariosStorageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((usuario): usuario is UsuarioCacheDto =>
            !!usuario &&
            typeof usuario.id === 'string' &&
            typeof usuario.nombre === 'string'
          )
        : [];
    } catch (error) {
      console.warn('No se pudo leer la caché de todos-usuarios:', error);
      return [];
    }
  }

  tieneTodosUsuariosEnCache(): boolean {
    return this.obtenerTodosUsuariosCache().length > 0;
  }

  cargarTodosUsuariosEnStorage(forceRefresh = false): Observable<UsuarioCacheDto[]> {
    const usuariosCacheados = this.obtenerTodosUsuariosCache();
    if (!forceRefresh && usuariosCacheados.length > 0) {
      return of(usuariosCacheados);
    }

    return this.obtenerUsuarios().pipe(
      map((usuarios) => usuarios.map(({ id, nombre }) => ({ id, nombre }))),
      tap((usuarios) => {
        localStorage.setItem(this.todosUsuariosStorageKey, JSON.stringify(usuarios));
      })
    );
  }

  obtenerRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlService}/roles`).pipe(
      catchError(error => {
        console.error('Error al obtener roles:', error);
        return throwError(() => error);
      })
    );
  }

  actualizarRolesUsuario(correoElectronico: string, roles: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar-roles-usuarios`, {
      correoElectronico,
      roles
    }).pipe(
      catchError(error => {
        console.error('Error al actualizar roles de usuario:', error);
        return throwError(() => error);
      })
    );
  }
}
