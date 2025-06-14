import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductPage } from '../model/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = 'http://localhost:8080/products';

  constructor(private http: HttpClient) {}

  obtenerProductos(barcodeOrName: string = '', page: number = 0, size: number = 10): Observable<ProductPage> {
    let params = new HttpParams()
      .set('barcodeOrName', barcodeOrName)
      .set('page', page)
      .set('size', size);
    return this.http.get<ProductPage>(this.apiUrl, { params });
  }
}
