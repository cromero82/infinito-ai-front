import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface NaturalezaTipoEgresoDto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface NaturalezaTipoEgresoWriteDto {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NaturalezaTipoEgresoService {
  private apiUrl = `${environment.apiUrlRelationalDb}/naturaleza_tipo_egresos`;

  constructor(private http: HttpClient) {}

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
  }

  getAll(soloActivas = false): Observable<NaturalezaTipoEgresoDto[]> {
    const q = soloActivas ? '?soloActivas=true' : '';
    return this.http.get<NaturalezaTipoEgresoDto[]>(`${this.apiUrl}${q}`, {
      headers: new HttpHeaders({ Accept: 'application/json' })
    });
  }

  create(dto: NaturalezaTipoEgresoWriteDto): Observable<NaturalezaTipoEgresoDto> {
    return this.http.post<NaturalezaTipoEgresoDto>(this.apiUrl, dto, {
      headers: this.jsonHeaders()
    });
  }

  update(id: number, dto: NaturalezaTipoEgresoWriteDto): Observable<NaturalezaTipoEgresoDto> {
    return this.http.put<NaturalezaTipoEgresoDto>(`${this.apiUrl}/${id}`, dto, {
      headers: this.jsonHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
