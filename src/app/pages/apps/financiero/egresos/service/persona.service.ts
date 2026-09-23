import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface PersonaDto {
  id: number;
  documento: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  activo?: boolean;
  esDuenoPropietario?: boolean;
}

export interface PersonaWriteDto {
  documento: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  activo?: boolean;
  esDuenoPropietario?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private apiUrl = `${environment.apiUrlRelationalDb}/personas`;

  constructor(private http: HttpClient) {}

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
  }

  getAll(soloActivas = false): Observable<PersonaDto[]> {
    let params = new HttpParams();
    if (soloActivas) {
      params = params.set('soloActivas', 'true');
    }
    return this.http.get<PersonaDto[]>(this.apiUrl, {
      headers: new HttpHeaders({ Accept: 'application/json' }),
      params
    });
  }

  create(dto: PersonaWriteDto): Observable<PersonaDto> {
    return this.http.post<PersonaDto>(this.apiUrl, dto, {
      headers: this.jsonHeaders()
    });
  }

  update(id: number, dto: PersonaWriteDto): Observable<PersonaDto> {
    return this.http.put<PersonaDto>(`${this.apiUrl}/${id}`, dto, {
      headers: this.jsonHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
