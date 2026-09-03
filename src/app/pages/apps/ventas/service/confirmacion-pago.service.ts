import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface CandidatoAmbiguoDto {
  historialElectronicoId: number;
  historialReciboId?: number | null;
  abonoCxcId?: number | null;
  montoEsperado: number;
  nombrePagadorSugerido?: string | null;
}

export interface PendienteConfirmacionDto {
  id: number;
  historialReciboId?: number | null;
  abonoCxcId?: number | null;
  sesionId?: number | null;
  metodoPagoId?: number | null;
  montoEsperado: number;
  montoRecibido?: number | null;
  estado: 'CREADA' | 'CONFIRMADA' | 'AMBIGUA' | 'HUERFANA' | string;
  nombrePagador?: string | null;
  nombreCliente?: string | null;
  numeroVenta?: string | null;
  fechaCreacion?: string;
  fechaConfirmacion?: string | null;
  notificacionId?: number | null;
  ambiguo?: boolean;
  candidatos?: CandidatoAmbiguoDto[] | null;
  /** Tras faltante QR: abrir modal Generar crédito. */
  abrirCxcManual?: boolean | null;
  ticketIdReabierto?: number | null;
  reciboIdReabierto?: number | null;
  totalTicketReabierto?: number | null;
  faltante?: number | null;
}

export interface NotificacionSinAsignarDto {
  id: number;
  monto: number;
  nombrePagador?: string | null;
  asunto?: string | null;
  recibidoEn?: string | null;
  metodoPagoId?: number | null;
}

export interface MontoDistintoConfirmacionDto {
  code: string;
  historialElectronicoId: number;
  notificacionId: number;
  montoEsperado: number;
  montoRecibido: number;
  diferencia: number;
  nombrePagador?: string | null;
  mensaje?: string | null;
  requiereOrigenDevolucion?: boolean | null;
  creaCxcFaltante?: boolean | null;
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

  getSinAsignar(): Observable<NotificacionSinAsignarDto[]> {
    return this.http.get<NotificacionSinAsignarDto[]>(
      `${this.base}/api/notificaciones/sin-asignar`
    );
  }

  marcarConfirmadas(historialElectronicoIds: number[]): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(
      `${this.base}/api/notificaciones/confirmadas`,
      { historialElectronicoIds }
    );
  }

  asignar(
    historialElectronicoId: number,
    notificacionId: number,
    confirmarMontoDistinto = false,
    origenFondosDevolucionId?: number | null
  ): Observable<PendienteConfirmacionDto> {
    return this.http
      .put<PendienteConfirmacionDto>(
        `${this.base}/api/recibos-electronicos/${historialElectronicoId}/asignar`,
        {
          notificacionId,
          confirmarMontoDistinto,
          origenFondosDevolucionId: origenFondosDevolucionId ?? null
        }
      )
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 409 && err.error?.code === 'MONTO_DISTINTO') {
            return throwError(() => err.error as MontoDistintoConfirmacionDto);
          }
          return throwError(() => err);
        })
      );
  }

  yaNoEsperar(historialElectronicoId: number): Observable<PendienteConfirmacionDto> {
    return this.http.put<PendienteConfirmacionDto>(
      `${this.base}/api/recibos-electronicos/${historialElectronicoId}/ya-no-esperar`,
      {}
    );
  }

  /**
   * Corrige el medio del pendiente HRE (venta o abono) en relational.
   * Cascada: historial_recibo_pago / abono_cxc (+ traslado OF si aplica).
   */
  corregirMetodoPago(
    historialElectronicoId: number,
    metodoPagoId: number
  ): Observable<{ id: number; metodoPagoId: number | null; estado?: string }> {
    const url = `${environment.apiUrlRelationalDb}/historial-recibos-electronicos/${historialElectronicoId}/corregir-metodo-pago`;
    return this.http.put<{ id: number; metodoPagoId: number | null; estado?: string }>(url, {
      metodoPagoId
    });
  }
}
