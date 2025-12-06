import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/**
 * DTO que representa las ventas por tipo de método de pago
 * Son las ventas agrupadas por método de pago y fecha
 */
export interface VentasTipoDto {
  id: number;
  metodoPagoId: number;
  fecha: string; // Formato: YYYY-MM-DD
  total: number;
}

/**
 * Servicio para consultar ventas por tipo de método de pago
 * Las ventas están agrupadas por método de pago y fecha
 */
@Injectable({
  providedIn: 'root'
})
export class VentasTipoService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/ventas-tipo`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las ventas del día actual
   * @returns Observable con array de ventas por tipo de método de pago
   */
  getVentasDelDia(): Observable<VentasTipoDto[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json'
    });
    return this.http.get<VentasTipoDto[]>(this.apiUrl, { headers });
  }

  /**
   * Obtiene las ventas por una fecha específica
   * @param fecha Fecha en formato YYYY-MM-DD (ej: "2023-11-25")
   * @returns Observable con array de ventas por tipo de método de pago
   */
  getVentasPorFecha(fecha: string): Observable<VentasTipoDto[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json'
    });
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<VentasTipoDto[]>(`${this.apiUrl}/by-fecha`, { headers, params });
  }

  /**
   * Obtiene las ventas en un rango de fechas
   * @param fechaInicio Fecha de inicio en formato YYYY-MM-DD (ej: "2023-11-01")
   * @param fechaFin Fecha de fin en formato YYYY-MM-DD (ej: "2023-11-30")
   * @returns Observable con array de ventas por tipo de método de pago
   */
  getVentasPorRangoFechas(fechaInicio: string, fechaFin: string): Observable<VentasTipoDto[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json'
    });
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get<VentasTipoDto[]>(`${this.apiUrl}/by-fecha-range`, { headers, params });
  }

  /**
   * Registra una venta por tipo de método de pago
   * @param venta Datos de la venta (metodoPagoId, fecha, total)
   * @returns Observable con la venta creada
   */
  crearVentaTipo(venta: { metodoPagoId: number; fecha: string; total: number }): Observable<VentasTipoDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http.post<VentasTipoDto>(this.apiUrl, venta, { headers });
  }
}

