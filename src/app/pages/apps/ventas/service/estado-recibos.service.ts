import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface EstadoReciboDto {
  id: number;
  descripcion: string;
  sigla: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoRecibosService {
  private apiUrl = `${environment.apiUrlRelationalDb}/estado-recibos`;
  private readonly storageKey = environment.localStorageKeyEstadosRecibos ?? 'estados_recibos';

  constructor(private http: HttpClient) {}

  getEstadosRecibos(): Observable<EstadoReciboDto[]> {
    const cached = localStorage.getItem(this.storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as EstadoReciboDto[];
        if (Array.isArray(parsed)) {
          return of(parsed);
        }
      } catch {
        localStorage.removeItem(this.storageKey);
      }
    }

    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<EstadoReciboDto[]>(this.apiUrl, { headers }).pipe(
      tap((estados) => localStorage.setItem(this.storageKey, JSON.stringify(estados)))
    );
  }
}

