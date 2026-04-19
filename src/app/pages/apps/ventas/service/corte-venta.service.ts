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
   * Fecha de calendario local (YYYY-MM-DD) a partir de un ISO, ignorando la hora.
   * Sirve para agrupar cortes que caen el mismo día aunque `fechaIni`/`fechaFin` difieran en hora.
   */
  static fechaCalendarioDesdeIso(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Agrupa cortes que comparten el mismo día de calendario (según `fechaIni`), **sin** separar por usuario.
   * Suma totales y fusiona `ventasTipo` por `metodoPagoId`. Sirve para vistas tipo dashboard: un solo valor por día.
   */
  agruparPorFechaCalendario(
    cortes: CorteVentaSearchItemDto[]
  ): CorteVentaSearchItemDto[] {
    if (!cortes?.length) {
      return [];
    }

    const grupos = new Map<string, CorteVentaSearchItemDto[]>();
    for (const c of cortes) {
      const dia = CorteVentaService.fechaCalendarioDesdeIso(c.fechaIni);
      const arr = grupos.get(dia);
      if (arr) {
        arr.push(c);
      } else {
        grupos.set(dia, [c]);
      }
    }

    const resultado: CorteVentaSearchItemDto[] = [];
    for (const [, items] of grupos) {
      resultado.push(this.combinarCortesMismoDiaUsuario(items));
    }

    return resultado.sort((a, b) => a.fechaIni.localeCompare(b.fechaIni));
  }

  /**
   * Agrupa cortes que comparten el mismo día de calendario y el mismo usuario.
   * Suma totales y fusiona `ventasTipo` por `metodoPagoId`.
   * Más granular que {@link agruparPorFechaCalendario} (mantiene un registro por día y usuario).
   */
  agruparPorFechaYUsuario(
    cortes: CorteVentaSearchItemDto[]
  ): CorteVentaSearchItemDto[] {
    if (!cortes?.length) {
      return [];
    }

    const grupos = new Map<string, CorteVentaSearchItemDto[]>();
    for (const c of cortes) {
      const dia = CorteVentaService.fechaCalendarioDesdeIso(c.fechaIni);
      const uid = String(c.usuarioId ?? '');
      const key = `${dia}\u0000${uid}`;
      const arr = grupos.get(key);
      if (arr) {
        arr.push(c);
      } else {
        grupos.set(key, [c]);
      }
    }

    const resultado: CorteVentaSearchItemDto[] = [];
    for (const [, items] of grupos) {
      resultado.push(this.combinarCortesMismoDiaUsuario(items));
    }

    return resultado.sort((a, b) => {
      const cmpF = a.fechaIni.localeCompare(b.fechaIni);
      if (cmpF !== 0) {
        return cmpF;
      }
      return String(a.usuarioId).localeCompare(String(b.usuarioId));
    });
  }

  private combinarCortesMismoDiaUsuario(
    items: CorteVentaSearchItemDto[]
  ): CorteVentaSearchItemDto {
    if (items.length === 1) {
      return { ...items[0] };
    }

    let fechaIniMin = items[0].fechaIni;
    let fechaFinMax = items[0].fechaFin;
    let total = 0;
    let totalSistema = 0;
    let idMin = items[0].id;

    const ventasPorMetodo = new Map<
      number,
      { total: number; totalSistema: number; corteVentaId?: number; id?: number }
    >();

    for (const it of items) {
      if (it.fechaIni < fechaIniMin) {
        fechaIniMin = it.fechaIni;
      }
      if (it.fechaFin > fechaFinMax) {
        fechaFinMax = it.fechaFin;
      }
      total += Number(it.total) || 0;
      totalSistema += Number(it.totalSistema) || 0;
      idMin = Math.min(idMin, it.id);

      for (const vt of it.ventasTipo || []) {
        const mid = vt.metodoPagoId;
        const prev = ventasPorMetodo.get(mid);
        const t = Number(vt.total) || 0;
        const ts = Number(vt.totalSistema) || 0;
        if (prev) {
          prev.total += t;
          prev.totalSistema += ts;
        } else {
          ventasPorMetodo.set(mid, {
            total: t,
            totalSistema: ts,
            corteVentaId: vt.corteVentaId,
            id: vt.id
          });
        }
      }
    }

    const ventasTipo: VentaTipoSearchDto[] = [];
    for (const [metodoPagoId, agg] of ventasPorMetodo) {
      ventasTipo.push({
        metodoPagoId,
        total: agg.total,
        totalSistema: agg.totalSistema,
        corteVentaId: agg.corteVentaId,
        id: agg.id
      });
    }
    ventasTipo.sort((a, b) => a.metodoPagoId - b.metodoPagoId);

    const ultimoCorte = items.some((i) => i.ultimoCorte);
    const actual = items.some((i) => i.actual);

    const base = items[0];
    return {
      id: idMin,
      usuarioId: base.usuarioId,
      fechaIni: fechaIniMin,
      fechaFin: fechaFinMax,
      ultimoHistorialReciboId: base.ultimoHistorialReciboId,
      total,
      totalSistema,
      ventasTipo,
      ultimoCorte,
      actual
    };
  }

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

  /**
   * Elimina un corte de venta por id.
   */
  eliminar(id: number): Observable<void> {
    const headers = new HttpHeaders({
      Accept: 'application/json'
    });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
