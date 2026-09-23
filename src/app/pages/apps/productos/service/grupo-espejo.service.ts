import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ActualizarGrupoEspejoRequest,
  CrearGrupoEspejoRequest,
  GrupoEspejoDto
} from '../model/grupo-espejo';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GrupoEspejoService {
  private readonly baseUrl = `${environment.apiUrlRelationalDb}/grupos-espejo`;

  constructor(private http: HttpClient) {}

  buscar(query: string): Observable<GrupoEspejoDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = new HttpParams().set('query', query ?? '');
    return this.http.get<GrupoEspejoDto[]>(this.baseUrl, { headers, params });
  }

  /**
   * Actualiza datos del grupo espejo (nombre).
   * PUT /grupos-espejo/{id}
   */
  actualizarGrupo(
    grupoId: number,
    body: ActualizarGrupoEspejoRequest
  ): Observable<GrupoEspejoDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.put<GrupoEspejoDto>(`${this.baseUrl}/${grupoId}`, body, {
      headers
    });
  }

  crear(body: CrearGrupoEspejoRequest): Observable<GrupoEspejoDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.post<GrupoEspejoDto>(this.baseUrl, body, { headers });
  }

  agregarProducto(grupoId: number, productoId: number): Observable<GrupoEspejoDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.put<GrupoEspejoDto>(
      `${this.baseUrl}/${grupoId}/productos/${productoId}`,
      {},
      { headers }
    );
  }

  quitarProducto(grupoId: number, productoId: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.baseUrl}/${grupoId}/productos/${productoId}`, {
      headers
    });
  }
}
