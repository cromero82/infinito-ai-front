import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AbrirCuentaPorCobrarRequest {
  ticketId: number;
  reciboId: number;
  clienteId: number;
  clienteNombre?: string | null;
  telefono: string;
  correo?: string | null;
  documento?: string | null;
  /** Total del ticket (suma productos). */
  totalTicket: number;
  /** Abono de contado al abrir (0 = todo a crédito). */
  abono: number;
  /** Saldo a crédito (monto_original / saldo_pendiente). */
  monto: number;
  observacion?: string | null;
}

export interface CuentaPorCobrarDto {
  id: number;
  historialReciboId?: number | null;
  documentoVentaId?: number | null;
  reciboId?: number | null;
  ticketId?: number | null;
  clienteId: number;
  clienteNombre?: string | null;
  clienteTelefono?: string | null;
  clienteCorreo?: string | null;
  fechaOrigen: string;
  montoOriginal: number;
  saldoPendiente: number;
  estado: string;
  observacion?: string | null;
}

export interface RegistrarAbonoCxcRequest {
  monto: number;
  metodoPagoId: number;
  origenFondosId?: number | null;
  observacion?: string | null;
}

export interface AbonoCxcDto {
  id: number;
  cuentaPorCobrarId: number;
  fechaAbono: string;
  monto: number;
  metodoPagoId: number;
  metodoPagoDescripcion?: string | null;
  origenFondosId?: number | null;
  movimientoOrigenFondosId?: number | null;
  observacion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CuentaPorCobrarService {
  private readonly apiUrl = `${environment.apiUrlRelationalDb}/cuentas-por-cobrar`;

  constructor(private http: HttpClient) {}

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
  }

  private acceptHeaders(): HttpHeaders {
    return new HttpHeaders({ Accept: 'application/json' });
  }

  abrir(body: AbrirCuentaPorCobrarRequest): Observable<CuentaPorCobrarDto> {
    return this.http.post<CuentaPorCobrarDto>(`${this.apiUrl}/abrir`, body, {
      headers: this.jsonHeaders()
    });
  }

  findById(id: number): Observable<CuentaPorCobrarDto> {
    return this.http.get<CuentaPorCobrarDto>(`${this.apiUrl}/${id}`, {
      headers: this.acceptHeaders()
    });
  }

  findVigentePorRecibo(reciboId: number): Observable<CuentaPorCobrarDto> {
    return this.http.get<CuentaPorCobrarDto>(
      `${this.apiUrl}/por-recibo/${reciboId}`,
      { headers: this.acceptHeaders() }
    );
  }

  findVigentePorTicket(ticketId: number): Observable<CuentaPorCobrarDto> {
    return this.http.get<CuentaPorCobrarDto>(
      `${this.apiUrl}/por-ticket/${ticketId}`,
      { headers: this.acceptHeaders() }
    );
  }

  listarVigentes(): Observable<CuentaPorCobrarDto[]> {
    return this.http.get<CuentaPorCobrarDto[]>(`${this.apiUrl}/vigentes`, {
      headers: this.acceptHeaders()
    });
  }

  listarArchivados(): Observable<CuentaPorCobrarDto[]> {
    return this.http.get<CuentaPorCobrarDto[]>(`${this.apiUrl}/archivados`, {
      headers: this.acceptHeaders()
    });
  }

  listarAbonos(cuentaId: number): Observable<AbonoCxcDto[]> {
    return this.http.get<AbonoCxcDto[]>(`${this.apiUrl}/${cuentaId}/abonos`, {
      headers: this.acceptHeaders()
    });
  }

  registrarAbono(
    cuentaId: number,
    body: RegistrarAbonoCxcRequest
  ): Observable<AbonoCxcDto> {
    return this.http.post<AbonoCxcDto>(
      `${this.apiUrl}/${cuentaId}/abonos`,
      body,
      { headers: this.jsonHeaders() }
    );
  }
}
