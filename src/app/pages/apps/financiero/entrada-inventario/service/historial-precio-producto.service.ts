import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface HistorialPrecioProductoDto {
  id: number;
  entradaInventarioDetalleId: number;
  productoId: number;
  usuarioId?: string | null;
  fechaCreacion: string;
  precioCompra?: number | null;
  precioCompraAntes?: number | null;
  precioVenta?: number | null;
  precioVentaAntes?: number | null;
  porcentajeGanancia?: number | null;
  porcentajeGananciaAntes?: number | null;
}

@Injectable({ providedIn: 'root' })
export class HistorialPrecioProductoService {
  private apiUrl = `${environment.apiUrlRelationalDb}/api/historial-precio-producto`;

  constructor(private http: HttpClient) {}

  findByProductoId(productoId: number): Observable<HistorialPrecioProductoDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<HistorialPrecioProductoDto[]>(
      `${this.apiUrl}/producto/${productoId}`,
      { headers }
    );
  }
}
