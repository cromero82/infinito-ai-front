import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { Producto } from '../../../productos/model/producto';

export type EntradaInventarioEstado = 'BORRADOR' | 'CONFIRMADA' | 'ANULADA';

export interface EntradaInventarioDetalleDto {
  id: number;
  productoId: number;
  cantidad: number;
  precioCompraRegistrado: number;
  precioCompraAnterior?: number | null;
  precioVentaActual?: number | null;
  precioVentaNuevo?: number | null;
  porcentajeGananciaCalc?: number | null;
  porcentajeVariacionCompra?: number | null;
  alertaPrecioSubio: boolean;
  producto?: Producto;
}

export interface EntradaInventarioDto {
  id: number;
  egresoId: number;
  estado: EntradaInventarioEstado;
  fechaCreacion?: string;
  fechaConfirmacion?: string;
  totalItems?: number;
  observaciones?: string;
  detalles?: EntradaInventarioDetalleDto[];
  egreso?: {
    id: number;
    fecha?: string;
    valor?: number;
    descripcion?: string;
    proveedor?: { id: number; nombre?: string };
  };
}

export interface EntradaInventarioEstadoResumenDto {
  egresoId: number;
  entradaId: number;
  estado: EntradaInventarioEstado;
  totalItems: number;
}

export interface PrecioCompraPreviewDto {
  productoId: number;
  productoNombre?: string;
  productoBarcode?: string;
  precioCompraAnterior?: number | null;
  precioCompraNuevo: number;
  precioVentaActual?: number | null;
  porcentajeGanancia?: number | null;
  porcentajeGananciaDisplay?: string | null;
  porcentajeVariacionCompra?: number | null;
  porcentajeVariacionCompraDisplay?: string | null;
  precioCompraCambio: boolean;
  alertaPrecioSubio: boolean;
  tienePrecioCompraAnterior: boolean;
}

export interface EntradaInventarioDetalleRequest {
  productoId: number;
  cantidad: number;
  precioCompra: number;
  precioVenta?: number | null;
}

@Injectable({ providedIn: 'root' })
export class EntradaInventarioService {
  private apiUrl = `${environment.apiUrlRelationalDb}/api/entrada-inventario`;

  constructor(private http: HttpClient) {}

  obtenerOCrearPorEgreso(egresoId: number): Observable<EntradaInventarioDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.post<EntradaInventarioDto>(
      `${this.apiUrl}/por-egreso/${egresoId}`,
      {},
      { headers }
    );
  }

  getByEgreso(egresoId: number): Observable<EntradaInventarioDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<EntradaInventarioDto>(
      `${this.apiUrl}/por-egreso/${egresoId}`,
      { headers }
    );
  }

  resumenPorEgresoIds(egresoIds: number[]): Observable<EntradaInventarioEstadoResumenDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = new HttpParams().set('egresoIds', egresoIds.join(','));
    return this.http.get<EntradaInventarioEstadoResumenDto[]>(`${this.apiUrl}/resumen`, {
      headers,
      params
    });
  }

  previewPrecioCompra(
    productoId: number,
    precioCompra: number
  ): Observable<PrecioCompraPreviewDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const params = new HttpParams()
      .set('productoId', productoId.toString())
      .set('precioCompra', precioCompra.toString());
    return this.http.get<PrecioCompraPreviewDto>(`${this.apiUrl}/preview-precio`, {
      headers,
      params
    });
  }

  agregarDetalle(
    entradaId: number,
    body: EntradaInventarioDetalleRequest
  ): Observable<EntradaInventarioDetalleDto> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
    return this.http.post<EntradaInventarioDetalleDto>(
      `${this.apiUrl}/${entradaId}/detalle`,
      body,
      { headers }
    );
  }

  eliminarDetalle(
    entradaId: number,
    detalleId: number
  ): Observable<EntradaInventarioDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<EntradaInventarioDto>(
      `${this.apiUrl}/${entradaId}/detalle/${detalleId}`,
      { headers }
    );
  }

  confirmar(entradaId: number): Observable<EntradaInventarioDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.post<EntradaInventarioDto>(
      `${this.apiUrl}/${entradaId}/confirmar`,
      {},
      { headers }
    );
  }
}
