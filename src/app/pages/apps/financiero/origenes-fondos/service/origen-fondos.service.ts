import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { OrigenFondosArbolItemDto } from '../util/origen-fondos-arbol.util';

export interface OrigenFondosDto {
  id: number;
  nombre: string;
  tipoOrigenFondosId?: number;
  tipoOrigenFondosNombre?: string;
  tipoOrigenFondosCodigo?: string;
  proveedorId?: number | null;
  metodoPagoId?: number | null;
  parentOrigenFondosId?: number | null;
  naturaleza?: string;
  visibleEnEgreso?: boolean;
  requiereConciliacion?: boolean;
  activo?: boolean;
  orden?: number;
  color?: string | null;
  notas?: string | null;
  saldo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrigenFondosService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/origenes-fondos`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<OrigenFondosDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<OrigenFondosDto[]>(this.apiUrl, { headers });
  }

  findParaEgreso(): Observable<OrigenFondosDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<OrigenFondosDto[]>(`${this.apiUrl}/para-egreso`, { headers });
  }

  findArbol(): Observable<OrigenFondosArbolItemDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<OrigenFondosArbolItemDto[]>(`${this.apiUrl}/arbol`, { headers });
  }

  findArbolParaEgreso(): Observable<OrigenFondosArbolItemDto[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<OrigenFondosArbolItemDto[]>(`${this.apiUrl}/arbol-egreso`, { headers });
  }

  findById(id: number): Observable<OrigenFondosDto> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<OrigenFondosDto>(`${this.apiUrl}/${id}`, { headers });
  }
}
