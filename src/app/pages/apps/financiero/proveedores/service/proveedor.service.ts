import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

/** Regex para formato UUID de Java (ej: E4B8999C-FBCF-466D-91B9-599E39850BDE) */
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuidDocumento(value: string | null | undefined): boolean {
  return !!value && UUID_REGEX.test(value.trim());
}

export function getDocumentoDisplay(documento: string | null | undefined): string {
  if (!documento) return '-';
  return isUuidDocumento(documento) ? '(Autogenerado)' : documento;
}

export interface ProveedorDto {
  id: number;
  documento: string;
  nombre: string;
  telefono: string;
  correo: string;
  tipoEgreso?: { id: number; nombre?: string; descripcion?: string };
}

export interface CreateProveedorRequest {
  documento: string;
  nombre: string;
  telefono: string;
  correo: string;
  tipoEgreso?: { id: number };
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = `${environment.apiUrlRelationalDb}/proveedores`;

  constructor(private http: HttpClient) {}

  getProveedores(): Observable<ProveedorDto[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.get<ProveedorDto[]>(this.apiUrl, { headers });
  }

  createProveedor(proveedor: CreateProveedorRequest): Observable<ProveedorDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<ProveedorDto>(this.apiUrl, proveedor, { headers });
  }

  updateProveedor(id: number, proveedor: CreateProveedorRequest): Observable<ProveedorDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<ProveedorDto>(`${this.apiUrl}/${id}`, proveedor, { headers });
  }
}
