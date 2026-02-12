import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface MetodoPagoDto {
  id: number;
  descripcion: string;
  estado: string;
  file: string;
  sigla: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/metodos-pago`;
  private readonly storageKey = 'metodos_pago';

  constructor(private http: HttpClient) {}

  obtenerMetodosPago(): Observable<MetodoPagoDto[]> {
    const cached = localStorage.getItem(this.storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as MetodoPagoDto[];
        if (Array.isArray(parsed)) {
          return of(parsed);
        }
      } catch {
        localStorage.removeItem(this.storageKey);
      }
    }

    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<MetodoPagoDto[]>(this.apiUrl, { headers }).pipe(
      tap((metodos) => localStorage.setItem(this.storageKey, JSON.stringify(metodos)))
    );
  }
}

