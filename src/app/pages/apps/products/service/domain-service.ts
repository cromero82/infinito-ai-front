import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DomainService {
  constructor(private http: HttpClient) {}

  getTypes(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/types');
  }

  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/mongoquery/companies');
  }
}
