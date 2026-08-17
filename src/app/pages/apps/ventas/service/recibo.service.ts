import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ReciboDto {
  id: number;
  clienteId: number;
  cliente: {
    id: number;
    nombre: string;
    telefono: string;
    documento: string;
  };
  fechaCreacion: string;
  estadoId: number;
  estado: string;
  metodoPagoId: number | null;
  total: number;
  ticketId?: number;
  sesionId?: number;
}

export interface ReciboPagoResponseDto {
  pagado: boolean;
  historialReciboId?: number;
  documentoVentaId?: number;
  documentoVentaConsecutivo?: string | null;
  total?: number;
  fechaCreacion?: string;
  metodoPagoId?: number;
  clienteId?: number;
  sesionId?: number;
  pagos?: ReciboPagoLinea[];
}

export type ActualizarReciboResponse = ReciboDto | ReciboPagoResponseDto;

export function isReciboPagoResponse(
  value: ActualizarReciboResponse
): value is ReciboPagoResponseDto {
  return (
    value != null &&
    typeof value === 'object' &&
    'pagado' in value &&
    (value as ReciboPagoResponseDto).pagado === true
  );
}

export interface ReciboPagoLinea {
  metodoPagoId: number;
  monto: number;
}

export interface ActualizarReciboRequest {
  clienteId: number;
  ticketId: number;
  estadoId: number;
  metodoPagoId: number;
  total: string;
  sesionId?: number;
  montoRecibido: number;
  /** Desglose de cobro (1–3). Si se omite, el BE usa metodoPagoId + total. */
  pagos?: ReciboPagoLinea[];
}

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private apiUrl = `${environment.apiUrlRelationalDb}/recibos`;

  constructor(private http: HttpClient) {}

  getRecibo(reciboId: number): Observable<ReciboDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ReciboDto>(`${this.apiUrl}/${reciboId}`, { headers });
  }

  actualizarRecibo(
    reciboId: number,
    payload: ActualizarReciboRequest
  ): Observable<ActualizarReciboResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.put<ActualizarReciboResponse>(
      `${this.apiUrl}/${reciboId}`,
      payload,
      { headers }
    );
  }
}
