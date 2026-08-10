import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface CandidatoAmbiguoDto {
  historialElectronicoId: number;
  historialReciboId: number;
  montoEsperado: number;
  nombrePagadorSugerido?: string | null;
}

export interface PendienteConfirmacionDto {
  id: number;
  historialReciboId: number;
  sesionId?: number | null;
  metodoPagoId?: number | null;
  montoEsperado: number;
  estado: 'CREADA' | 'CONFIRMADA' | 'AMBIGUA' | 'HUERFANA' | string;
  nombrePagador?: string | null;
  nombreCliente?: string | null;
  numeroVenta?: string | null;
  fechaCreacion?: string;
  fechaConfirmacion?: string | null;
  notificacionId?: number | null;
  ambiguo?: boolean;
  candidatos?: CandidatoAmbiguoDto[] | null;
}

@Injectable({ providedIn: 'root' })
export class ConfirmacionPagoService {
  private readonly base = `${environment.apiUrlPuenteTienda || ''}`;

  constructor(private http: HttpClient) {}

  getPendientes(sesionId: number): Observable<PendienteConfirmacionDto[]> {
    const params = new HttpParams().set('sesionId', String(sesionId));
    return this.http.get<PendienteConfirmacionDto[]>(
      `${this.base}/api/notificaciones/pendientes`,
      { params }
    );
  }

  marcarConfirmadas(historialElectronicoIds: number[]): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(
      `${this.base}/api/notificaciones/confirmadas`,
      { historialElectronicoIds }
    );
  }

  asignar(historialElectronicoId: number, notificacionId: number): Observable<PendienteConfirmacionDto> {
    return this.http.put<PendienteConfirmacionDto>(
      `${this.base}/api/recibos-electronicos/${historialElectronicoId}/asignar`,
      { notificacionId }
    );
  }

  yaNoEsperar(historialElectronicoId: number): Observable<PendienteConfirmacionDto> {
    return this.http.put<PendienteConfirmacionDto>(
      `${this.base}/api/recibos-electronicos/${historialElectronicoId}/ya-no-esperar`,
      {}
    );
  }
}
