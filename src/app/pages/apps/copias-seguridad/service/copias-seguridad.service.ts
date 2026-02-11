import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CopiasSeguridadService {
  private apiUrl = `${environment.apiUrlRelationalDb}/copias-seguridad`;

  constructor(private http: HttpClient) {}

  generarBackup(): Observable<Blob> {
    const headers = new HttpHeaders({
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    return this.http.get(`${this.apiUrl}/generar-backup`, { 
      headers,
      responseType: 'blob'
    });
  }

  exportarACorreo(): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.get<any>(`${this.apiUrl}/exportar-a-correo`, { headers });
  }
}
