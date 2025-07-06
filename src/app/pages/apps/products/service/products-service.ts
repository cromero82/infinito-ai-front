import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductPage } from '../model/producto';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private apiUrl = 'http://localhost:8080/'+ "products";

  constructor(private http: HttpClient) {}

  obtenerProductos(barcodeOrName: string = '', page: number = 0, size: number = 10): Observable<ProductPage> {
    let params = new HttpParams()
      .set('barcodeOrName', barcodeOrName)
      .set('page', page)
      .set('size', size);
    return this.http.get<ProductPage>(this.apiUrl , { params });
  }

  speechToText(file: File | Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post( this.apiUrl + "/speech-to-text", formData);
  }

  getProductsSmart(query: string = '', page: number = 0, size: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('q', query)
      .set('page', page)
      .set('size', size);
    return this.http.get<any>('http://localhost:8080/api/mongoquery/products/page-smart-search', { params });
  }

  addProduct(product: any): Observable<any> {
    return this.http.post<any>('http://localhost:8080/api/mongoquery/products/add', product);
  }

  modifyProduct(id: string, product: any): Observable<any> {
    return this.http.put<any>(`http://localhost:8080/api/mongoquery/products/edit/${id}`, product);
  }

  /**
   * Uploads an image for a product after add/edit.
   * @param productId The product ID returned from backend
   * @param file The image file to upload
   * @param name Optional image name
   * @param expiration Optional expiration date
   */
  uploadProductImage(productId: string, file: File, name?: string, expiration?: string): Observable<any> {
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (expiration) formData.append('expiration', expiration);
    return this.http.post<any>('http://localhost:8080/api/images/upload', formData);
  }
}
