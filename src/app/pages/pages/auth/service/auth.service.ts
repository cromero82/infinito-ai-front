import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/auth';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Usar responseType: 'text' para evitar que Angular intente parsear como JSON automáticamente
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' }).pipe(
      map((response: string) => {
        // Log para debug
        console.log('Respuesta del servidor (texto):', response);
        console.log('Tipo de respuesta:', typeof response);
        
        let token: string | undefined;
        
        if (!response || response.trim() === '') {
          throw new Error('Respuesta vacía del servidor');
        }
        
        // Intentar parsear como JSON primero (por si viene como objeto JSON stringificado)
        try {
          const parsed = JSON.parse(response);
          if (parsed && typeof parsed === 'object') {
            // Si es un objeto JSON, buscar el token
            token = parsed.token || 
                    parsed.accessToken || 
                    parsed.access_token || 
                    parsed.data?.token ||
                    parsed.data?.accessToken;
          }
        } catch (e) {
          // Si no es JSON válido, asumir que la respuesta es directamente el token
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
        // handleAuthResponse ya maneja sus propios errores internamente
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  registro(datos: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse | string>(`${this.apiUrl}/registro`, datos).pipe(
      map(response => {
        // Manejar si la respuesta es un string (token directo) o un objeto
        let token: string;
        
        if (typeof response === 'string') {
          token = response;
        } else if (response && typeof response === 'object' && 'token' in response) {
          token = response.token;
        } else {
          // Si la respuesta no tiene el formato esperado, intentar extraer el token de otras formas
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
        // Si el error viene del map o tap, lo propagamos
        console.error('Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  private handleAuthResponse(response: AuthResponse): void {
    // Guardar token en localStorage
    localStorage.setItem('user-token', response.token);

    // Decodificar JWT (el payload está en base64)
    try {
      const payload = this.decodeJwt(response.token);
      
      // Guardar nombre y roles en localStorage
      if (payload.nombre) {
        localStorage.setItem('user-nombre', payload.nombre);
      }
      if (payload.roles && Array.isArray(payload.roles)) {
        // Si roles es un array de objetos, extraer solo las siglas o nombres
        // Si es un array de strings, guardarlo directamente
        let rolesToStore: string[];
        if (payload.roles.length > 0 && typeof payload.roles[0] === 'object') {
          // Array de objetos: extraer siglas
          rolesToStore = (payload.roles as Array<{ sigla: string; nombre: string }>).map(r => r.sigla || r.nombre);
          
          // Guardar el nombre del primer rol para mostrar en el toolbar
          const primerRol = payload.roles[0] as { sigla: string; nombre: string };
          if (primerRol.nombre) {
            localStorage.setItem('user-rol-nombre', primerRol.nombre);
          }
        } else {
          // Array de strings
          rolesToStore = payload.roles as string[];
          if (rolesToStore.length > 0) {
            localStorage.setItem('user-rol-nombre', rolesToStore[0]);
          }
        }
        localStorage.setItem('user-roles', JSON.stringify(rolesToStore));
      }
    } catch (error) {
      // No lanzar el error, solo loguearlo
      // El token se guarda de todas formas, la decodificación es opcional
      console.warn('Advertencia: No se pudo decodificar el JWT completamente:', error);
      console.log('El token se ha guardado en localStorage de todas formas');
    }
  }

  private decodeJwt(token: string): JwtPayload {
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw new Error('Token JWT inválido: token vacío o no es un string');
      }

      // JWT tiene 3 partes separadas por puntos: header.payload.signature
      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        throw new Error(`Token JWT inválido: debe tener 3 partes separadas por puntos, pero tiene ${parts.length}`);
      }

      // Decodificar el payload (segunda parte)
      const payloadEncoded = parts[1];
      
      if (!payloadEncoded || payloadEncoded.trim() === '') {
        throw new Error('Token JWT inválido: payload vacío');
      }
      
      // Reemplazar caracteres base64url por base64 estándar
      let base64 = payloadEncoded.replace(/-/g, '+').replace(/_/g, '/');
      
      // Agregar padding si es necesario
      const paddingLength = (4 - base64.length % 4) % 4;
      const padded = base64 + '='.repeat(paddingLength);
      
      // Decodificar de base64
      let decoded: string;
      try {
        decoded = atob(padded);
      } catch (e) {
        throw new Error(`Error al decodificar base64: ${e}. Base64: ${padded.substring(0, 50)}...`);
      }
      
      if (!decoded || decoded.trim() === '') {
        throw new Error('Token JWT inválido: payload decodificado está vacío');
      }
      
      // Parsear JSON
      let parsed: any;
      try {
        parsed = JSON.parse(decoded);
        console.log('JWT decodificado exitosamente:', parsed);
      } catch (e) {
        throw new Error(`Error al parsear JSON del payload: ${e}. Payload decodificado: ${decoded}`);
      }
      
      return parsed as JwtPayload;
    } catch (error) {
      // Lanzar error con más información para debug
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
    // Primero intentar obtener roles del localStorage
    const roles = this.getRoles();
    if (roles.length > 0) {
      // Verificar si alguno de los roles tiene la sigla "admin" (case insensitive)
      return roles.some(rol => rol && rol.toLowerCase() === 'admin');
    }
    
    // Si no hay roles en localStorage, intentar obtener del token
    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeJwt(token);
        if (payload.roles && Array.isArray(payload.roles)) {
          if (payload.roles.length > 0 && typeof payload.roles[0] === 'object') {
            // Array de objetos: verificar siglas
            const rolesArray = payload.roles as Array<{ sigla: string; nombre: string }>;
            return rolesArray.some(rol => rol.sigla && rol.sigla.toLowerCase() === 'admin');
          } else {
            // Array de strings
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

  logout(): void {
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-nombre');
    localStorage.removeItem('user-roles');
    localStorage.removeItem('user-rol-nombre');
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
        // El endpoint puede devolver texto o un objeto JSON
        try {
          return JSON.parse(response);
        } catch {
          // Si no es JSON, devolver el texto directamente
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
    // Verificar que al menos un campo esté presente
    const camposPresentes = Object.keys(datos).filter(key => datos[key as keyof ActualizarUsuarioRequest] !== undefined && datos[key as keyof ActualizarUsuarioRequest] !== null && datos[key as keyof ActualizarUsuarioRequest] !== '');
    
    if (camposPresentes.length === 0) {
      return throwError(() => new Error('Debe enviar al menos un campo para actualizar'));
    }

    // Crear objeto solo con los campos presentes
    const datosAEnviar: any = {};
    camposPresentes.forEach(key => {
      datosAEnviar[key] = datos[key as keyof ActualizarUsuarioRequest];
    });

    // El interceptor authInterceptor añade automáticamente el header Authorization
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

  obtenerUsuarios(): Observable<any[]> {
    // El interceptor authInterceptor añade automáticamente el header Authorization
    return this.http.get<any[]>(`${this.apiUrl}/usuarios-no-admin`).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => error);
      })
    );
  }
}

