import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  /**
   * Medio del abono inicial. Obligatorio si abono > 0
   * (queda en abonos y alimenta historial multipago al liquidar).
   */
  metodoPagoId?: number | null;
  /** Saldo a crédito (monto_original / saldo_pendiente). */
  monto: number;
  observacion?: string | null;
  /** Sesión de caja activa (panel confirmación QR). */
  sesionId?: number | null;
  /**
   * HRE ya confirmado (faltante QR): retarget a abono en vez de pendiente nuevo.
   */
  historialElectronicoId?: number | null;
}

export interface CerrarCuentaPorCobrarRequest {
  motivoTexto?: string | null;
  motivoOperacionId?: number | null;
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
  /** Total ticket sincronizado (suma productos). */
  totalTicket?: number | null;
  estado: string;
  observacion?: string | null;
  fechaCierre?: string | null;
  motivoCierreTexto?: string | null;
  movimientoInventarioId?: number | null;
  valorPerdidaCosto?: number | null;
  /** Abonos (incl. inicial). Anular solo si 0. */
  cantidadAbonos?: number | null;
}

export interface RegistrarAbonoCxcRequest {
  monto: number;
  metodoPagoId: number;
  origenFondosId?: number | null;
  observacion?: string | null;
  /** Sesión de caja activa (panel confirmación QR). */
  sesionId?: number | null;
  /** Cliente que entrega el abono (puede diferir del deudor). */
  clientePagadorId?: number | null;
  clientePagadorNombre?: string | null;
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
  clientePagadorId?: number | null;
  clientePagadorNombre?: string | null;
  /** True si el abono fue QR y quedó pendiente de confirmación email. */
  requiereConfirmacionElectronica?: boolean | null;
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

  /**
   * Ajusta CxC vigente del ticket al nuevo total (agregar/quitar ítems).
   * 204 → null.
   */
  sincronizarTotalTicket(
    ticketId: number,
    totalTicket: number
  ): Observable<CuentaPorCobrarDto | null> {
    return this.http
      .post<CuentaPorCobrarDto>(
        `${this.apiUrl}/por-ticket/${ticketId}/sincronizar-total`,
        { totalTicket },
        {
          headers: this.jsonHeaders(),
          observe: 'response'
        }
      )
      .pipe(
        map((res) => (res.status === 204 ? null : (res.body ?? null)))
      );
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

  /** Anula CxC vigente solo si no hay abonos. */
  anular(
    cuentaId: number,
    body?: CerrarCuentaPorCobrarRequest | null
  ): Observable<CuentaPorCobrarDto> {
    return this.http.post<CuentaPorCobrarDto>(
      `${this.apiUrl}/${cuentaId}/anular`,
      body ?? {},
      { headers: this.jsonHeaders() }
    );
  }

  /** Castiga cartera: CASTIGADA + salida inventario a costo. */
  castigar(
    cuentaId: number,
    body: CerrarCuentaPorCobrarRequest
  ): Observable<CuentaPorCobrarDto> {
    return this.http.post<CuentaPorCobrarDto>(
      `${this.apiUrl}/${cuentaId}/castigar`,
      body,
      { headers: this.jsonHeaders() }
    );
  }
}
