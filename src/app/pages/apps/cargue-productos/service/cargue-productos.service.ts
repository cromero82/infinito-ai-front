import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface CargueProductoDto {
  id: number;
  nombre: string;
  fechaCreacion: string;
  totalMigrados: number;
  totalConflictos: number;
  totalConflictosResultos: number;
  mensajesError: string | null;
}

export interface CargueProductoConflictoDto {
  id: number;
  cargueProducto: CargueProductoDto;
  tipoConflictoId: number;
  nombreProducto: string | null;
  datosConflicto: string; // JSON string
  resuelto: boolean;
  tipoConflicto: string;
}

export interface ConflictoItem {
  codigoBarras?: string;
  codigoBarras2nd?: string;
  precio?: number;
  precio2nd?: number;
  nombre?: string;
  [key: string]: any; // Para otros campos que puedan venir
}

export interface ConflictoParsed {
  conflicto: CargueProductoConflictoDto;
  items: ConflictoItem[];
  nombreExtraido?: string;
  precioExtraido?: number;
}

export enum TipoConflictoId {
  DOS_PRODUCTOS_NOMBRES_IGUALES = 1,
  IGUAL_NOMBRE_Y_CODIGO_BARRAS = 2
}

export const TipoConflictoLabels: Record<TipoConflictoId, string> = {
  [TipoConflictoId.DOS_PRODUCTOS_NOMBRES_IGUALES]: 'Dos productos con nombres iguales',
  [TipoConflictoId.IGUAL_NOMBRE_Y_CODIGO_BARRAS]: 'Igual nombre y código de barras'
};

@Injectable({
  providedIn: 'root'
})
export class CargueProductosService {
  private apiUrl = `${environment.apiUrlRelationalDb}/api/cargue-productos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los cargues de productos
   */
  getCargueProductos(): Observable<CargueProductoDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    return this.http.get<CargueProductoDto[]>(this.apiUrl, { headers });
  }

  /**
   * Obtiene los conflictos de un cargue de productos específico
   */
  getConflictosByCargueProductoId(cargueProductoId: number, unicamenteNoResueltos: boolean = true): Observable<CargueProductoConflictoDto[]> {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    let params = new HttpParams()
      .set('cargueProductoId', String(cargueProductoId))
      .set('unicamenteNoResueltos', String(unicamenteNoResueltos));
    return this.http.get<CargueProductoConflictoDto[]>(`${environment.apiUrlRelationalDb}/api/cargue-producto-conflictos`, { headers, params });
  }

  /**
   * Registra un nuevo cargue de productos con un archivo Excel/CSV
   */
  registrarCargueProducto(nombre: string, file: File): Observable<CargueProductoDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nombre', nombre);

    // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.post<CargueProductoDto>(this.apiUrl, formData, { headers });
  }

  /**
   * Resuelve un conflicto de cargue de productos
   */
  resolverConflicto(conflictoId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.put<any>(`${environment.apiUrlRelationalDb}/api/cargue-producto-conflictos/${conflictoId}/resolver`, {}, { headers });
  }
}

