import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductPage, Producto, BusquedaPorFiltrosResponse } from '../model/producto';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RelationalProductService {
  private apiUrl = `${environment.apiUrlRelationalDb}/products`;

  constructor(private http: HttpClient) { }

  /**
   * Gets products with pagination and optional search filter
   * GET /products/search?query=&page=0&size=10&unicamenteActivos=false
   * @param query Search filter for barcode or name
   * @param page Page number (0-indexed)
   * @param size Number of items per page
   * @param unicamenteActivos If true, filters only active products. If false (default), includes all
   */
  getProducts(query: string = '', page: number = 0, size: number = 10, unicamenteActivos: boolean = false): Observable<ProductPage> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('unicamenteActivos', unicamenteActivos.toString());

    return this.http.get<ProductPage>(`${this.apiUrl}/search`, { params, headers });
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

  /**
   * Deletes a product by ID
   * @param productId The ID of the product to delete
   */
  deleteProduct(productId: number): Observable<void> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.delete<void>(`${this.apiUrl}/${productId}`, { headers });
  }

  /**
   * Searches for a product by barcode
   * @param barcode The barcode to search for
   */
  searchByBarcode(barcode: string): Observable<Producto> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    const params = new HttpParams().set('barcode', barcode);

    return this.http.get<Producto>(`${this.apiUrl}/search-by-barcode`, { params, headers });
  }

  /**
   * Activates a product
   * @param productId The ID of the product to activate
   */
  activateProduct(productId: number): Observable<Producto> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.patch<Producto>(`${this.apiUrl}/${productId}/activate`, {}, { headers });
  }

  /**
   * Deactivates a product
   * @param productId The ID of the product to deactivate
   */
  deactivateProduct(productId: number): Observable<Producto> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.patch<Producto>(`${this.apiUrl}/${productId}/deactivate`, {}, { headers });
  }

  /**
   * Gets products using advanced filters and sorting
   * POST /products/busquedaPorFiltros?query=...
   * @param payload Request body containing filters, pagination, and sorting details
   * @param query Search query (sent as URL query param, optional)
   */
  busquedaPorFiltros(payload: any, query?: string): Observable<ProductPage & { percentFromTotal?: number }> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    let params = new HttpParams();
    if (query != null && query !== '') {
      params = params.set('query', query);
    }

    return this.http.post<BusquedaPorFiltrosResponse>(`${this.apiUrl}/busquedaPorFiltros`, payload, { headers, params })
      .pipe(
        map(res => ({
          ...res.page,
          percentFromTotal: res.percentFromTotal
        }))
      );
  }
}
