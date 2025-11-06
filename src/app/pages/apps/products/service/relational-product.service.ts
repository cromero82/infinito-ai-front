import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductPage, Producto } from '../model/producto';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RelationalProductService {
  private apiUrl = `${environment.apiUrlRelationalDb}/products`;

  constructor(private http: HttpClient) {}

  /**
   * Gets products with pagination and optional search filter
   * @param barcodeOrName Search filter for barcode or name
   * @param page Page number (0-indexed)
   * @param size Number of items per page
   */
  getProducts(barcodeOrName: string = '', page: number = 0, size: number = 100): Observable<ProductPage> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    let params = new HttpParams()
      .set('barcodeOrName', barcodeOrName)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ProductPage>(this.apiUrl, { params, headers });
  }

  /**
   * Creates a new product
   * @param product The product data to create
   */
  createProduct(product: Producto): Observable<Producto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<Producto>(this.apiUrl, product, { headers });
  }

  /**
   * Updates an existing product
   * @param productId The ID of the product to update
   * @param product The product data to update
   */
  updateProduct(productId: number, product: Producto): Observable<Producto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.put<Producto>(`${this.apiUrl}/${productId}`, product, { headers });
  }
}
