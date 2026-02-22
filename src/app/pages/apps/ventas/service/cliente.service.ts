import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClienteDto {
  id: number;
  nombre: string;
  telefono?: string;
  documento?: string;
}

export interface CreateClienteRequest {
  nombre: string;
  telefono?: string;
  documento?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:8088/clients';

  constructor(private http: HttpClient) {}

  getClientes(): Observable<ClienteDto[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.get<ClienteDto[]>(this.apiUrl, { headers });
  }

  createCliente(cliente: CreateClienteRequest): Observable<ClienteDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<ClienteDto>(this.apiUrl, cliente, { headers });
  }

  updateCliente(id: number, cliente: CreateClienteRequest): Observable<ClienteDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<ClienteDto>(`${this.apiUrl}/${id}`, cliente, { headers });
  }

  getClienteById(id: number): Observable<ClienteDto> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.get<ClienteDto>(`${this.apiUrl}/${id}`, { headers });
  }
}

