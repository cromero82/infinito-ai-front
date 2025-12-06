import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface EstadoReciboDto {
  id: number;
  descripcion: string;
  sigla: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoRecibosService {
  private apiUrl = `${environment.apiUrlRelationalDb}/estado-recibos`;

  constructor(private http: HttpClient) {}

  getEstadosRecibos(): Observable<EstadoReciboDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<EstadoReciboDto[]>(this.apiUrl, { headers });
  }
}

