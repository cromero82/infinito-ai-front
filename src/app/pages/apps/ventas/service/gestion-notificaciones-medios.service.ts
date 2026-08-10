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
  historialReciboElectronicoId?: number | null;
  plantillaNotificacionId?: number | null;
  plantillaNombre?: string | null;
  plantillaIcono?: string | null;
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
  icono: string;
  activo?: boolean;
  orden?: number;
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

  listar(estadoVista?: string, q?: string): Observable<NotificacionEmailPagoDto[]> {
    let params = new HttpParams();
    if (estadoVista) {
      params = params.set('estadoVista', estadoVista);
    }
    if (q) {
      params = params.set('q', q);
    }
    return this.http.get<NotificacionEmailPagoDto[]>(`${this.base}/api/notificaciones-email`, {
      params
    });
  }

  archivar(id: number): Observable<NotificacionEmailPagoDto> {
    return this.http.put<NotificacionEmailPagoDto>(
      `${this.base}/api/notificaciones-email/${id}/archivar`,
      {}
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
