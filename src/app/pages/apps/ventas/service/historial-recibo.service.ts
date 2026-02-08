import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface QuickReciboRequest {
  clienteId: number;
  metodoPagoId: number;
  sesionId: number;
  total: number;
  montoRecibido: number;
}

export interface HistorialReciboDto {
  id: number;
  clienteId: number;
  fechaCreacion: string;
  estadoId: number;
  metodoPagoId: number;
  sesionId: number;
  total: number;
}

export interface HistorialReciboPage {
  content: HistorialReciboDto[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialReciboService {
  private apiUrl = `${environment.apiUrlRelationalDb}/historial-recibos`;

  constructor(private http: HttpClient) {}

  addQuickRecibo(payload: QuickReciboRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.post<any>(`${this.apiUrl}/addquickRecibo`, payload, { headers });
  }

  searchHistorialRecibos(
    page: number = 1,
    size: number = 10,
    sort: string = 'fechaCreacion,desc',
    fecha?: string,
    estadoId?: number,
    sesionId?: number | null
  ): Observable<HistorialReciboPage> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    let params = new HttpParams()
      .set('page', String(page - 1)) // Spring uses 0-based page numbers
      .set('size', String(size))
      .set('sort', sort);
    
    // Add fecha parameter if provided
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    
    // Add estadoId parameter if provided
    if (estadoId !== undefined && estadoId !== null) {
      params = params.set('estadoId', String(estadoId));
    }
    
    // Add sesionId parameter if provided
    if (sesionId !== undefined && sesionId !== null) {
      params = params.set('sesionId', String(sesionId));
    }
    
    return this.http.get<HistorialReciboPage>(`${this.apiUrl}/search`, { headers, params });
  }

  updateHistorialRecibo(
    reciboId: number,
    sesionId: number,
    payload: {
      clienteId: number;
      estadoId: number;
      metodoPagoId: number;
      total: number;
      montoRecibido: number;
    }
  ): Observable<HistorialReciboDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    const params = new HttpParams().set('sesionId', String(sesionId));
    return this.http.put<HistorialReciboDto>(`${this.apiUrl}/${reciboId}`, payload, { headers, params });
  }

  volverAEditar(reciboId: number, sesionId: number, estadoId: number): Observable<HistorialReciboDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    const params = new HttpParams().set('sesionId', String(sesionId));
    const payload = { estadoId };
    return this.http.put<HistorialReciboDto>(`${this.apiUrl}/${reciboId}`, payload, { headers, params });
  }

  /**
   * Obtiene el total de ventas para una fecha específica
   * @param fecha Fecha en formato YYYY-MM-DD (ej: "2025-11-29")
   * @returns Observable con el total de ventas (número escalar)
   */
  getTotalByDate(fecha: string): Observable<number> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<number>(`${this.apiUrl}/total-by-date`, { headers, params });
  }
}

