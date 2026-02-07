import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/**
 * DTO que representa la venta por método de pago en el corte
 */
export interface VentaTipoCorteDto {
  metodoPagoId: number;
  totalSistema: number;
}

/**
 * DTO que representa el resultado de la consulta de rango para corte de ventas
 */
export interface ConsultarRangoCorteDto {
  fechaIni: string;
  fechaFin: string;
  ultimoCorte: any | null;
  ventasTipo: VentaTipoCorteDto[];
  total: number;
  otrosCortesIntersectados: any[];
}

/**
 * DTO de venta tipo en un corte (search)
 */
export interface VentaTipoSearchDto {
  id?: number;
  metodoPagoId: number;
  total: number;
  totalSistema: number;
  corteVentaId?: number;
}

/**
 * DTO de un corte de venta en la búsqueda
 */
export interface CorteVentaSearchItemDto {
  id: number;
  usuarioId: string;
  fechaIni: string;
  fechaFin: string;
  ultimoHistorialReciboId?: number;
  total: number;
  totalSistema: number;
  ventasTipo: VentaTipoSearchDto[];
  ultimoCorte: boolean;
  actual: boolean;
}

/**
 * Parámetros para consultar el rango de corte de ventas
 */
export interface ConsultarRangoParams {
  fechaIni: string; // Formato ISO: YYYY-MM-DDTHH:mm:ss
  fechaFin: string; // Formato ISO: YYYY-MM-DDTHH:mm:ss
  ultimoCorte: boolean;
  actual: boolean;
}

/**
 * DTO para un ítem de venta tipo en el registro de corte
 */
export interface VentaTipoRegistroItemDto {
  metodoPagoId: number;
  total: number;
  totalSistema: number;
}

/**
 * DTO para registrar un corte de ventas
 */
export interface RegistrarCorteDto {
  fechaIni: string; // Formato ISO: YYYY-MM-DDTHH:mm:ss
  fechaFin: string; // Formato ISO: YYYY-MM-DDTHH:mm:ss
  total: number;
  totalSistema: number;
  ultimoCorte: boolean;
  actual: boolean;
  ventasTipo: VentaTipoRegistroItemDto[];
}

/**
 * Servicio para gestión de cortes de venta
 */
@Injectable({
  providedIn: 'root'
})
export class CorteVentaService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/corte-venta`;

  constructor(private http: HttpClient) {}

  /**
   * Consulta los totales por método de pago en un rango de fechas
   * @param params Parámetros de consulta (fechaIni, fechaFin, ultimoCorte, actual)
   * @returns Observable con los datos del corte
   */
  consultarRango(params: ConsultarRangoParams): Observable<ConsultarRangoCorteDto> {
    const headers = new HttpHeaders({
      Accept: 'application/json'
    });

    let httpParams = new HttpParams()
      .set('fechaIni', params.fechaIni)
      .set('fechaFin', params.fechaFin)
      .set('ultimoCorte', String(params.ultimoCorte))
      .set('actual', String(params.actual));

    return this.http.get<ConsultarRangoCorteDto>(`${this.apiUrl}/consultar-rango`, {
      headers,
      params: httpParams
    });
  }

  /**
   * Busca cortes de venta en un rango de fechas
   * @param fechaIni Fecha inicio en formato ISO (YYYY-MM-DDTHH:mm:ss)
   * @param fechaFin Fecha fin en formato ISO (YYYY-MM-DDTHH:mm:ss)
   * @returns Observable con array de cortes
   */
  search(fechaIni: string, fechaFin: string): Observable<CorteVentaSearchItemDto[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json'
    });
    const params = new HttpParams()
      .set('fechaIni', fechaIni)
      .set('fechaFin', fechaFin);
    return this.http.get<CorteVentaSearchItemDto[]>(`${this.apiUrl}/search`, {
      headers,
      params
    });
  }

  /**
   * Registra un corte de ventas
   * @param dto Datos del corte a registrar
   * @returns Observable con la respuesta del servidor
   */
  registrarCorte(dto: RegistrarCorteDto): Observable<unknown> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.post(this.apiUrl, dto, { headers });
  }
}
