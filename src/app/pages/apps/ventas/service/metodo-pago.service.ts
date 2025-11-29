import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface MetodoPagoDto {
  id: number;
  descripcion: string;
  estado: string;
  file: string;
  sigla: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/metodos-pago`;

  constructor(private http: HttpClient) {}

  obtenerMetodosPago(): Observable<MetodoPagoDto[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json'
    });
    return this.http.get<MetodoPagoDto[]>(this.apiUrl, { headers });
  }
}

