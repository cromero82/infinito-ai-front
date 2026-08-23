import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface TipoEgresoDto {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface TipoEgresoWriteDto {
  nombre: string;
  descripcion?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TipoEgresoService {
  private apiUrl = `${environment.apiUrlRelationalDb}/tipo_egresos`;

  constructor(private http: HttpClient) {}

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
  }

  getTiposEgreso(): Observable<TipoEgresoDto[]> {
    return this.http.get<TipoEgresoDto[]>(this.apiUrl, {
      headers: new HttpHeaders({ Accept: 'application/json' })
    });
  }

  getById(id: number): Observable<TipoEgresoDto> {
    return this.http.get<TipoEgresoDto>(`${this.apiUrl}/${id}`, {
      headers: new HttpHeaders({ Accept: 'application/json' })
    });
  }

  create(dto: TipoEgresoWriteDto): Observable<TipoEgresoDto> {
    return this.http.post<TipoEgresoDto>(this.apiUrl, dto, {
      headers: this.jsonHeaders()
    });
  }

  update(id: number, dto: TipoEgresoWriteDto): Observable<TipoEgresoDto> {
    return this.http.put<TipoEgresoDto>(`${this.apiUrl}/${id}`, dto, {
      headers: this.jsonHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
