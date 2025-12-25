import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../pages/auth/service/auth.service';

export interface EventoDto {
  id: number;
  nombre: string;
  sigla: string;
}

export interface UsuarioBitacoraDto {
  id: string;
  nombre: string;
  correoElectronico: string;
  telefono: string;
  roles: Array<{
    id: number;
    nombre: string;
    sigla: string;
  }>;
}

export interface BitacoraUsuarioDto {
  id: number;
  userId: string;
  evento: EventoDto;
  valorAntes: string;
  valorDespues: string;
  fechaCreacion: string;
  usuario: UsuarioBitacoraDto;
}

export interface BitacoraUsuarioPage {
  content: BitacoraUsuarioDto[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BitacoraUsuarioService {
  private apiUrl = `${environment.apiUrlRelationalDb}/api/bitacora-usuario`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  searchBitacoraUsuario(
    userId: string,
    page: number = 0,
    size: number = 10,
    fecha?: string
  ): Observable<BitacoraUsuarioPage> {
    const token = this.authService.getToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    let params = new HttpParams()
      .set('userId', userId)
      .set('page', String(page))
      .set('size', String(size));

    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<BitacoraUsuarioPage>(`${this.apiUrl}/search`, { headers, params });
  }
}
