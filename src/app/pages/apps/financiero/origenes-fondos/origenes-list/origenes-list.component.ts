import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../../auth/service/auth.service';
import { EstablecimientoService } from '../../../ventas/service/establecimiento.service';
import { CorteVentaService } from '../../../ventas/service/corte-venta.service';
import { OrigenFondosService } from '../service/origen-fondos.service';
import {
  MovimientoOrigenFondosDto,
  MovimientoOrigenFondosService
} from '../service/movimiento-origen-fondos.service';
import {
  OrigenMovimientoDialogComponent,
  OrigenMovimientoTipo
} from '../origen-movimiento-dialog/origen-movimiento-dialog.component';
import { OrigenAjusteDialogComponent } from '../origen-ajuste-dialog/origen-ajuste-dialog.component';
import {
  agruparOrigenesArbol,
  OrigenFondosArbolItemDto,
  GrupoOrigenFondos,
  SaldoOfVista,
  mapVentasSinCortePorMetodo,
  saldoOrigenConVentasSinCorte,
  paramsConsultarRangoHastaAhora
} from '../util/origen-fondos-arbol.util';

@Component({
  selector: 'vex-origenes-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTableModule,
    MatDialogModule
  ],
  templateUrl: './origenes-list.component.html',
  styleUrl: './origenes-list.component.scss'
})
export class OrigenesListComponent implements OnInit {
  arbol: OrigenFondosArbolItemDto[] = [];
  grupos: GrupoOrigenFondos[] = [];
  movimientos: MovimientoOrigenFondosDto[] = [];
  cuentaSeleccionada: OrigenFondosArbolItemDto | null = null;
  loadingCuentas = false;
  loadingMovimientos = false;
  errorCuentas: string | null = null;
  modoEstricto = false;
  esAdmin = false;
  /** Ventas sin corte por metodoPagoId (mismo origen que Cierre de ventas). */
  private ventasSinCortePorMetodo = new Map<number, number>();
  periodoSinCorteLabel: string | null = null;

  movimientoColumns = [
    'fecha',
    'tipoMovimiento',
    'valor',
    'impacto',
    'saldoDespues',
    'detalle'
  ];

  constructor(
    private origenService: OrigenFondosService,
    private movimientoService: MovimientoOrigenFondosService,
    private corteVentaService: CorteVentaService,
    private establecimientoService: EstablecimientoService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.authService.isAdmin();
    this.establecimientoService.loadActual().subscribe({
      next: (est) => {
        this.modoEstricto = !!est.manejoEstrictoCuentas;
      }
    });
    this.cargarCuentas();
  }

  cargarCuentas(seleccionarId?: number): void {
    this.loadingCuentas = true;
    this.errorCuentas = null;
    const params = paramsConsultarRangoHastaAhora();

    forkJoin({
      arbol: this.origenService.findArbol(),
      rango: this.corteVentaService.consultarRango(params).pipe(
        catchError(() => {
          this.periodoSinCorteLabel = null;
          this.ventasSinCortePorMetodo = new Map();
          return of(null);
        })
      )
    }).subscribe({
      next: ({ arbol, rango }) => {
        this.arbol = arbol ?? [];
        this.aplicarVentasSinCorte(rango);
        this.grupos = agruparOrigenesArbol(this.arbol);
        this.loadingCuentas = false;
        if (this.arbol.length === 0) {
          this.cuentaSeleccionada = null;
          this.movimientos = [];
          return;
        }
        const id =
          seleccionarId ??
          this.cuentaSeleccionada?.id ??
          this.grupos[0]?.raiz.id;
        const cuenta = this.arbol.find((c) => c.id === id) ?? this.arbol[0];
        this.seleccionarCuenta(cuenta);
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        this.loadingCuentas = false;
        this.arbol = [];
        this.grupos = [];
        this.ventasSinCortePorMetodo = new Map();
        this.periodoSinCorteLabel = null;
        const detalle =
          err?.error?.message ||
          (err?.status === 403
            ? 'Tu usuario no tiene permiso para ver orígenes.'
            : err?.status === 0
              ? 'No hay conexión con el backend (:8088).'
              : `Error al cargar orígenes (HTTP ${err?.status ?? '?'}).`);
        this.errorCuentas = detalle;
        this.snackBar.open(detalle, 'Cerrar', { duration: 8000 });
      }
    });
  }

  /**
   * Raíces operativas con método de pago: ledger + ventas sin corte.
   * Los egresos del período ya están en el ledger (SALIDA_EGRESO); no se restan de nuevo.
   */
  saldoVista(cuenta: OrigenFondosArbolItemDto): SaldoOfVista {
    return saldoOrigenConVentasSinCorte(cuenta, this.ventasSinCortePorMetodo);
  }

  private aplicarVentasSinCorte(
    rango: {
      fechaIni?: string;
      fechaFin?: string;
      ventasTipo?: {
        metodoPagoId: number;
        totalVentasSistema?: number;
      }[];
    } | null
  ): void {
    this.ventasSinCortePorMetodo = mapVentasSinCortePorMetodo(rango?.ventasTipo);
    if (!rango?.ventasTipo?.length) {
      this.periodoSinCorteLabel = null;
      return;
    }
    if (rango.fechaIni && rango.fechaFin) {
      this.periodoSinCorteLabel = `${rango.fechaIni} → ${rango.fechaFin}`;
    } else {
      this.periodoSinCorteLabel = 'desde último corte';
    }
  }

  seleccionarCuenta(cuenta: OrigenFondosArbolItemDto): void {
    this.cuentaSeleccionada = cuenta;
    this.cargarMovimientos(cuenta.id);
  }

  /** Origen arrastrado actualmente (drag & drop para traslados). */
  origenArrastrado: OrigenFondosArbolItemDto | null = null;

  onDragStart(cuenta: OrigenFondosArbolItemDto, event: DragEvent): void {
    if (!this.esAdmin) {
      return;
    }
    this.origenArrastrado = cuenta;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(cuenta.id));
    }
  }

  onDragOver(event: DragEvent): void {
    if (this.esAdmin && this.origenArrastrado) {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  onDrop(destino: OrigenFondosArbolItemDto, event: DragEvent): void {
    event.preventDefault();
    const origen = this.origenArrastrado;
    this.origenArrastrado = null;
    if (!this.esAdmin || !origen) {
      return;
    }
    if (origen.id === destino.id) {
      return;
    }
    this.abrirTrasladoDragDrop(origen.id, destino.id);
  }

  onDragEnd(): void {
    this.origenArrastrado = null;
  }

  /**
   * Abre el modal de traslado con origen y destino ya seleccionados
   * (resultado de arrastrar una caja sobre otra).
   */
  private abrirTrasladoDragDrop(origenId: number, destinoId: number): void {
    const ref = this.dialog.open(OrigenMovimientoDialogComponent, {
      width: '520px',
      data: {
        tipo: 'traslado' as OrigenMovimientoTipo,
        cuentaId: origenId,
        destinoId,
        arbol: this.arbol
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cargarCuentas(this.cuentaSeleccionada?.id);
        this.snackBar.open('Movimiento registrado', undefined, { duration: 2500 });
      }
    });
  }

  /**
   * Copia al portapapeles la información renderizada de una raíz (con desglose
   * de movimientos, tickets sin corte y total parcial).
   */
  copiarInfoRaiz(cuenta: OrigenFondosArbolItemDto): void {
    const sv = this.saldoVista(cuenta);
    const lineas: string[] = [cuenta.nombre];
    if (sv.mostrarDesglose) {
      lineas.push(`${this.formatoMoneda(sv.ledger)} MOVIMIENTOS`);
      lineas.push(`+${this.formatoMoneda(sv.ventasSinCorte)} TICKETS SIN CORTE`);
      lineas.push(`${this.formatoMoneda(sv.parcial)} TOTAL PARCIAL`);
    } else {
      lineas.push(`${this.formatoMoneda(sv.parcial)} TOTAL PARCIAL`);
    }
    this.copiarTexto(lineas.join('\n'));
  }

  /** Copia al portapapeles la información renderizada de un origen hijo. */
  copiarInfoHijo(hijo: OrigenFondosArbolItemDto): void {
    const texto = `${hijo.nombre}\n${this.formatoMoneda(hijo.saldo ?? 0)} SALDO`;
    this.copiarTexto(texto);
  }

  private formatoMoneda(valor: number | undefined): string {
    return Math.round(valor ?? 0).toString();
  }

  private copiarTexto(texto: string): void {
    const exito = () =>
      this.snackBar.open('Información copiada al portapapeles', undefined, {
        duration: 2000
      });
    const fallo = () =>
      this.snackBar.open('No se pudo copiar al portapapeles', 'Cerrar', {
        duration: 4000
      });

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(texto).then(exito, fallo);
    } else {
      try {
        const area = document.createElement('textarea');
        area.value = texto;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
        exito();
      } catch {
        fallo();
      }
    }
  }

  cargarMovimientos(cuentaId: number): void {
    this.loadingMovimientos = true;
    this.movimientoService.findByCuenta(cuentaId).subscribe({
      next: (movs) => {
        this.movimientos = [...movs].sort(
          (a, b) => b.fecha.localeCompare(a.fecha) || (b.id - a.id)
        );
        this.loadingMovimientos = false;
      },
      error: () => {
        this.loadingMovimientos = false;
        this.movimientos = [];
      }
    });
  }

  saldoClass(saldo: number | undefined): string {
    const s = saldo ?? 0;
    if (s < 0) return 'saldo-negativo';
    if (s === 0) return 'saldo-cero';
    return 'saldo-positivo';
  }

  cardAccent(cuenta: OrigenFondosArbolItemDto): string | null {
    return cuenta.color?.trim() || null;
  }

  tipoMovimientoLabel(tipo: string): string {
    const map: Record<string, string> = {
      ENTRADA_MANUAL: 'Entrada manual',
      ENTRADA_PRESTAMO: 'Préstamo',
      TRASLADO: 'Traslado',
      SALIDA_EGRESO: 'Egreso',
      AJUSTE_SALDO: 'Ajuste',
      AJUSTE_CIERRE: 'Ajuste cierre'
    };
    return map[tipo] ?? tipo;
  }

  detalleMovimiento(m: MovimientoOrigenFondosDto): string {
    const partes: string[] = [];
    if (m.origenDestinoNombre) partes.push(`→ ${m.origenDestinoNombre}`);
    if (m.terceroNombre) partes.push(m.terceroNombre);
    if (m.motivoMovimientoNombre) partes.push(m.motivoMovimientoNombre);
    if (m.observacion) partes.push(m.observacion);
    return partes.join(' · ') || '—';
  }

  abrirMovimiento(tipo: OrigenMovimientoTipo): void {
    if (!this.esAdmin) {
      this.snackBar.open('Solo admin puede registrar movimientos', 'Cerrar', {
        duration: 4000
      });
      return;
    }
    const ref = this.dialog.open(OrigenMovimientoDialogComponent, {
      width: '520px',
      data: {
        tipo,
        cuentaId: this.cuentaSeleccionada?.id,
        arbol: this.arbol
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cargarCuentas(this.cuentaSeleccionada?.id);
        this.snackBar.open('Movimiento registrado', undefined, { duration: 2500 });
      }
    });
  }

  abrirAjuste(): void {
    if (!this.esAdmin) {
      this.snackBar.open('Solo admin puede ajustar saldos', 'Cerrar', {
        duration: 4000
      });
      return;
    }
    const ref = this.dialog.open(OrigenAjusteDialogComponent, {
      width: '520px',
      data: {
        cuentaId: this.cuentaSeleccionada?.id,
        arbol: this.arbol
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cargarCuentas(this.cuentaSeleccionada?.id);
        this.snackBar.open('Ajuste registrado', undefined, { duration: 2500 });
      }
    });
  }
}
