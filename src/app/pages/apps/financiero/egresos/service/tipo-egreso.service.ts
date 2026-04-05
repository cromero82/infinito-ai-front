import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoEgresoDto {
  id: number;
  nombre: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class TipoEgresoService {
  private apiUrl = 'http://localhost:8088/tipo_egresos';

  constructor(private http: HttpClient) {}

  getTiposEgreso(): Observable<TipoEgresoDto[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.get<TipoEgresoDto[]>(this.apiUrl, { headers });
  }
}
