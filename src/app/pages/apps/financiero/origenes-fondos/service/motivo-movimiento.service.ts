import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface MotivoMovimientoDto {
  id: number;
  codigo: string;
  nombre: string;
  categoria?: string;
  sistema?: boolean;
  activo?: boolean;
  orden?: number;
  /** TRASLADO_OF | REGISTRAR_DOCUMENTO | AJUSTE_CIERRE | REVISAR */
  accionEsperada?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MotivoMovimientoService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/motivos-movimiento`;

  constructor(private http: HttpClient) {}

  findActivos(): Observable<MotivoMovimientoDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<MotivoMovimientoDto[]>(this.apiUrl, { headers });
  }
}
