import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductPage } from '../model/producto';
import { ProductInfo } from '../model/product-info.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly baseUrl = environment.apiUrlRelationalDb;
  private apiUrl = `${this.baseUrl}/products`;

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
    return this.http.get<any>(`${this.baseUrl}/api/mongoquery/products/page-smart-search`, { params });
  }

  addProduct(product: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/mongoquery/products/add`, product);
  }

  modifyProduct(id: string, product: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/mongoquery/products/edit/${id}`, product);
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
    return this.http.post<any>(`${this.baseUrl}/api/images/upload`, formData);
  }

  /**
   * Gets product info from external barcode service
   * @param barcode The barcode to query
   */
  getProductInfo(barcode: string): Observable<ProductInfo> {
    return this.http.get<ProductInfo>(`${this.baseUrl}/api/product-info/barcode/${barcode}`);
  }

  /**
   * Adds a new type to the backend.
   * @param name The type name
   * @param percentProfit The percent profit (default 0)
   */
  addType(name: string, percentProfit: number = 0): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/types`, {
      name,
      percentProfit
    });
  }

  /**
   * Adds a new company to the backend. 
   * @param name The company name
   */
  addCompany(name: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/mongoquery/companies`, {
      name,
      description: '',
      email: '',
      telefono: '',
      contact_name: ''
    });
  }
}
