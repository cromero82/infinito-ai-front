// filepath: src/app/pages/apps/productos/service/product-info-strategy.ts

import { Observable } from 'rxjs';
import { ProductInfo } from '../model/product-info.model';
import { environment } from '../../../../../environments/environment';

const API_BASE = environment.apiUrlRelationalDb;

export interface ProductInfoStrategy {
  getProduct(barcode: string): Observable<ProductInfo>;
  searchProduct(nameReference: string): Observable<ProductInfo[]>;
}

// Example implementation for OpenFoodFactsSite
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OpenFoodFactsSite implements ProductInfoStrategy {
  constructor(private http: HttpClient) {}

  getProduct(barcode: string): Observable<ProductInfo> {
    return this.http.get<ProductInfo>(`${API_BASE}/api/product-info/openfoodfacts/barcode/${barcode}`);
  }

  searchProduct(nameReference: string): Observable<ProductInfo[]> {
    // Not implemented yet, just a stub
    return this.http.get<ProductInfo[]>(`${API_BASE}/api/product-info/search?name=${encodeURIComponent(nameReference)}`);
  }
}

// Stubs for other strategies
@Injectable({ providedIn: 'root' })
export class ExitoStore implements ProductInfoStrategy {
  constructor(private http: HttpClient) {}
  getProduct(barcode: string): Observable<ProductInfo> {
    // Replace with actual Exito API endpoint
    return this.http.get<ProductInfo>(`${API_BASE}/api/product-info/exito/graphql/${barcode}`);
  }
  searchProduct(nameReference: string): Observable<ProductInfo[]> {
    return this.http.get<ProductInfo[]>(`${API_BASE}/api/exito/search?name=${encodeURIComponent(nameReference)}`);
  }
}

@Injectable({ providedIn: 'root' })
export class OlimpicaStore implements ProductInfoStrategy {
  constructor(private http: HttpClient) {}
  getProduct(barcode: string): Observable<ProductInfo> {
    // Replace with actual Olimpica API endpoint
    return this.http.get<ProductInfo>(`${API_BASE}/api/product-info/olimpica/barcode/${barcode}`);
  }
  searchProduct(nameReference: string): Observable<ProductInfo[]> {
    return this.http.get<ProductInfo[]>(`${API_BASE}/api/olimpica/search?name=${encodeURIComponent(nameReference)}`);
  }
}
