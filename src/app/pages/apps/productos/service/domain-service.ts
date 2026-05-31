import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DomainService {
  private readonly baseUrl = environment.apiUrlRelationalDb;

  constructor(private http: HttpClient) {}

  getTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/types`);
  }

  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/mongoquery/companies`);
  }
}
