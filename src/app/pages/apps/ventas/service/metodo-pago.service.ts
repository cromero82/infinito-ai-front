import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface MetodoPagoDto {
  id: number;
  descripcion: string;
  descripcionEgreso?: string | null;
  estado: string;
  file: string;
  sigla: string;
  color: string;
  visiblePagosEgresos?: boolean;
  visiblePagoTickets?: boolean;
  monto?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/metodos-pago`;
  /** v2: incluye descripcion_egreso y visible_pago_tickets */
  private readonly storageKey = 'metodos_pago_v2';

  constructor(private http: HttpClient) {}

  /** Todos los medios (cierre, historial, etiquetas). */
  obtenerMetodosPago(): Observable<MetodoPagoDto[]> {
    return this.fetchMetodosPago(this.storageKey, {});
  }

  /** Medios visibles al pagar ticket. */
  obtenerMetodosPagoParaTickets(): Observable<MetodoPagoDto[]> {
    return this.fetchMetodosPago(`${this.storageKey}_tickets`, {
      paraTickets: true
    });
  }

  /** Medios visibles al registrar egreso. */
  obtenerMetodosPagoParaEgresos(): Observable<MetodoPagoDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<MetodoPagoDto[]>(`${this.apiUrl}?paraEgresos=true`, {
      headers
    });
  }

  private fetchMetodosPago(
    cacheKey: string,
    params: { paraTickets?: boolean }
  ): Observable<MetodoPagoDto[]> {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as MetodoPagoDto[];
        if (Array.isArray(parsed)) {
          return of(parsed);
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    const headers = new HttpHeaders({ Accept: 'application/json' });
    const url = params.paraTickets
      ? `${this.apiUrl}?paraTickets=true`
      : this.apiUrl;
    return this.http.get<MetodoPagoDto[]>(url, { headers }).pipe(
      tap((metodos) => localStorage.setItem(cacheKey, JSON.stringify(metodos)))
    );
  }
}
