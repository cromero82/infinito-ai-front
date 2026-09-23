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
  permiteNotificacion?: boolean;
  monto?: number | null;
  codigoDianPaymentMeans?: string | null;
}

export interface MetodoPagoWriteDto {
  descripcion: string;
  descripcionEgreso?: string | null;
  estado?: string;
  file?: string | null;
  sigla?: string | null;
  color?: string | null;
  visiblePagosEgresos?: boolean;
  visiblePagoTickets?: boolean;
  permiteNotificacion?: boolean;
  monto?: number | null;
  codigoDianPaymentMeans?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/metodos-pago`;
  /** v3: incluye permiteNotificacion */
  private readonly storageKey = 'metodos_pago_v3';

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

  /** Medios que permiten notificaciones electrónicas (plantillas). */
  obtenerMetodosPagoParaNotificacion(): Observable<MetodoPagoDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<MetodoPagoDto[]>(`${this.apiUrl}?paraNotificacion=true`, {
      headers
    });
  }

  create(dto: MetodoPagoWriteDto): Observable<MetodoPagoDto> {
    return this.http
      .post<MetodoPagoDto>(this.apiUrl, dto, { headers: this.jsonHeaders() })
      .pipe(tap(() => this.clearCache()));
  }

  update(id: number, dto: MetodoPagoWriteDto): Observable<MetodoPagoDto> {
    return this.http
      .put<MetodoPagoDto>(`${this.apiUrl}/${id}`, dto, { headers: this.jsonHeaders() })
      .pipe(tap(() => this.clearCache()));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.clearCache()));
  }

  clearCache(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('metodos_pago'))
      .forEach((k) => localStorage.removeItem(k));
  }

  iconoUrl(file?: string | null): string {
    const f = (file || '').trim();
    if (!f) {
      return '';
    }
    return `assets/img/icons/payments/${f}`;
  }

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json'
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
