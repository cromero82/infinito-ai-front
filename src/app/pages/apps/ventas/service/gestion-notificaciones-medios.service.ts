import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface NotificacionEmailPagoDto {
  id: number;
  messageId?: string | null;
  recibidoEn: string;
  asunto?: string | null;
  cuerpoRaw?: string | null;
  cuerpoTexto?: string | null;
  monto?: number | null;
  nombrePagador?: string | null;
  referenciaCuenta?: string | null;
  metodoPagoId?: number | null;
  estadoVista: string;
  vinculoOperacion?: string | null;
  historialReciboElectronicoId?: number | null;
  egresoId?: number | null;
  plantillaNotificacionId?: number | null;
  plantillaNombre?: string | null;
  plantillaIcono?: string | null;
  /** True si matcheó plantilla de extracción (no spam Cloudflare). */
  provienePlantillaExtraccion?: boolean;
  clasificacion?: string | null;
  clasificacionObservacion?: string | null;
  clasificadoEn?: string | null;
}

export interface EgresoCandidatoAlertaDto {
  id: number;
  valor: number;
  fecha?: string | null;
  descripcion?: string | null;
  origenFondosId?: number | null;
  proveedorNombre?: string | null;
  personaNombre?: string | null;
}

export interface AlertaEgresoSinVincularDto {
  notificacion: NotificacionEmailPagoDto;
  origenFondosOrigenId?: number | null;
  origenFondosDestinoId?: number | null;
  candidatos: EgresoCandidatoAlertaDto[];
}

export interface AlertasEgresoSinVincularResponse {
  count: number;
  items: AlertaEgresoSinVincularDto[];
}

export interface TicketSinNotificacionDto {
  id: number;
  historialReciboId: number;
  historialReciboElectronicoId?: number | null;
  numeroVenta?: string | null;
  valor: number;
  fecha: string;
  persona?: string | null;
  marcadoEn: string;
}

export interface PlantillaNotificacionPagoDto {
  id: number;
  nombre: string;
  cuerpo: string;
  icono?: string | null;
  metodoPagoId?: number | null;
  activo?: boolean;
  orden?: number;
  naturaleza?: string | null;
  origenFondosOrigenId?: number | null;
  origenFondosDestinoId?: number | null;
  origenTipo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class GestionNotificacionesMediosService {
  private readonly base = `${environment.apiUrlPuenteTienda || ''}`;

  constructor(private http: HttpClient) {}

  iconoUrl(filename?: string | null): string {
    if (!filename) {
      return '';
    }
    return `${this.base}/api/plantillas-notificacion-pago/iconos/${filename}`;
  }

  listar(
    estadoVista?: string,
    q?: string,
    provienePlantillaExtraccion?: boolean | null,
    vinculoOperacion?: string | null
  ): Observable<NotificacionEmailPagoDto[]> {
    let params = new HttpParams();
    if (estadoVista) {
      params = params.set('estadoVista', estadoVista);
    }
    if (q) {
      params = params.set('q', q);
    }
    if (provienePlantillaExtraccion === true || provienePlantillaExtraccion === false) {
      params = params.set('provienePlantillaExtraccion', String(provienePlantillaExtraccion));
    }
    if (vinculoOperacion && vinculoOperacion !== 'TODAS') {
      params = params.set('vinculoOperacion', vinculoOperacion);
    }
    return this.http.get<NotificacionEmailPagoDto[]>(`${this.base}/api/notificaciones-email`, {
      params
    });
  }

  candidatasEgreso(egresoId: number): Observable<NotificacionEmailPagoDto[]> {
    const params = new HttpParams().set('egresoId', String(egresoId));
    return this.http.get<NotificacionEmailPagoDto[]>(
      `${this.base}/api/notificaciones-email/candidatas-egreso`,
      { params }
    );
  }

  asociarEgreso(notificacionId: number, egresoId: number): Observable<NotificacionEmailPagoDto> {
    return this.http.put<NotificacionEmailPagoDto>(
      `${this.base}/api/notificaciones-email/${notificacionId}/asociar-egreso`,
      { egresoId }
    );
  }

  alertasEgresoSinVincular(): Observable<AlertasEgresoSinVincularResponse> {
    return this.http.get<AlertasEgresoSinVincularResponse>(
      `${this.base}/api/notificaciones-email/alertas-egreso-sin-vincular`
    );
  }

  enviarABolsa(notificacionId: number): Observable<NotificacionEmailPagoDto> {
    return this.http.post<NotificacionEmailPagoDto>(
      `${this.base}/api/notificaciones-email/${notificacionId}/enviar-a-bolsa`,
      {}
    );
  }

  archivar(id: number): Observable<NotificacionEmailPagoDto> {
    return this.http.put<NotificacionEmailPagoDto>(
      `${this.base}/api/notificaciones-email/${id}/archivar`,
      {}
    );
  }

  legalizar(
    id: number,
    clasificacion: string,
    observacion?: string,
    origenFondosDestinoId?: number | null
  ): Observable<NotificacionEmailPagoDto> {
    const body: Record<string, unknown> = { clasificacion, observacion };
    if (origenFondosDestinoId != null) {
      body['origenFondosDestinoId'] = origenFondosDestinoId;
    }
    return this.http.put<NotificacionEmailPagoDto>(
      `${this.base}/api/notificaciones-email/${id}/legalizar`,
      body
    );
  }

  eliminar(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/api/notificaciones-email/${id}`);
  }

  listarPlantillas(): Observable<PlantillaNotificacionPagoDto[]> {
    return this.http.get<PlantillaNotificacionPagoDto[]>(
      `${this.base}/api/plantillas-notificacion-pago`
    );
  }

  crearPlantilla(body: Partial<PlantillaNotificacionPagoDto>): Observable<PlantillaNotificacionPagoDto> {
    return this.http.post<PlantillaNotificacionPagoDto>(
      `${this.base}/api/plantillas-notificacion-pago`,
      body
    );
  }

  guardarPlantilla(
    id: number,
    body: Partial<PlantillaNotificacionPagoDto>
  ): Observable<PlantillaNotificacionPagoDto> {
    return this.http.put<PlantillaNotificacionPagoDto>(
      `${this.base}/api/plantillas-notificacion-pago/${id}`,
      body
    );
  }

  eliminarPlantilla(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/api/plantillas-notificacion-pago/${id}`);
  }

  iconosDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/api/plantillas-notificacion-pago/iconos`);
  }

  listarTicketsSinNotificacion(): Observable<TicketSinNotificacionDto[]> {
    return this.http.get<TicketSinNotificacionDto[]>(`${this.base}/api/tickets-sin-notificacion`);
  }
}
