import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface EstablecimientoDto {
  id: number;
  razonSocial: string;
  nombreComercial?: string | null;
  nit?: string | null;
  digitoVerificacion?: string | null;
  regimenTributario: string;
  regimenLeyendaImpresion: string;
  manejoEstrictoCuentas?: boolean;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EstablecimientoService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/establecimiento`;
  private readonly storageKey = 'establecimiento_actual';
  private cached: EstablecimientoDto | null = null;

  constructor(private http: HttpClient) {
    this.cached = this.readFromStorage();
  }

  getSnapshot(): EstablecimientoDto | null {
    return this.cached;
  }

  loadActual(forceRefresh = false): Observable<EstablecimientoDto> {
    if (!forceRefresh && this.cached) {
      return of(this.cached);
    }

    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<EstablecimientoDto>(`${this.apiUrl}/actual`, { headers }).pipe(
      tap((est) => {
        this.cached = est;
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(est));
        } catch {
          // ignore quota / private mode
        }
      })
    );
  }

  update(id: number, payload: EstablecimientoDto): Observable<EstablecimientoDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return this.http
      .put<EstablecimientoDto>(`${this.apiUrl}/${id}`, payload, { headers })
      .pipe(
        tap((est) => {
          this.cached = est;
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(est));
          } catch {
            // ignore
          }
        })
      );
  }

  invalidateCache(): void {
    this.cached = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }

  private readFromStorage(): EstablecimientoDto | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as EstablecimientoDto;
      return parsed?.razonSocial ? parsed : null;
    } catch {
      return null;
    }
  }
}
