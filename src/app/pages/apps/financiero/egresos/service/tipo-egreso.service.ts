import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface TipoEgresoDto {
  id: number;
  nombre: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class TipoEgresoService {
  private apiUrl = `${environment.apiUrlRelationalDb}/tipo_egresos`;

  constructor(private http: HttpClient) {}

  getTiposEgreso(): Observable<TipoEgresoDto[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.get<TipoEgresoDto[]>(this.apiUrl, { headers });
  }
}
