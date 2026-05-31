import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tipo } from '../interfaces/tipo.interface';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TiposService {
  private apiUrl = `${environment.apiUrlRelationalDb}/api/types`;

  constructor(private http: HttpClient) {}

  getTipos(): Observable<Tipo[]> {
    return this.http.get<Tipo[]>(this.apiUrl);
  }

  getTipo(id: number): Observable<Tipo> {
    return this.http.get<Tipo>(`${this.apiUrl}/${id}`);
  }

  createTipo(tipo: Partial<Tipo>): Observable<Tipo> {
    return this.http.post<Tipo>(this.apiUrl, tipo);
  }

  updateTipo(id: number, tipo: Partial<Tipo>): Observable<Tipo> {
    return this.http.put<Tipo>(`${this.apiUrl}/${id}`, tipo);
  }

  deleteTipo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 