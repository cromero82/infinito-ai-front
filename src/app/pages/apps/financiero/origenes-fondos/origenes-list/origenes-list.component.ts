import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../../auth/service/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../../core/components/confirm-dialog/confirm-dialog.component';
import { EstablecimientoService } from '../../../ventas/service/establecimiento.service';
import { CorteVentaService } from '../../../ventas/service/corte-venta.service';
import {
  MetodoPagoDto,
  MetodoPagoService
} from '../../../ventas/service/metodo-pago.service';
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
import { MovimientoReferenciaDialogComponent } from '../movimiento-referencia-dialog/movimiento-referencia-dialog.component';
import { OrigenHijoDialogComponent } from '../origen-hijo-dialog/origen-hijo-dialog.component';
import {
  agruparOrigenesArbol,
  OrigenFondosArbolItemDto,
  GrupoOrigenFondos,
  SaldoOfVista,
  mapVentasSinCortePorMetodo,
  saldoOrigenConVentasSinCorte,
  paramsConsultarRangoHastaAhora
} from '../util/origen-fondos-arbol.util';
import { FooterService } from '../../../../../layouts/services/footer.service';
import { FooterItemDto } from '../../../../../layouts/components/footer/footer.component';

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
    MatDialogModule,
    MatMenuModule
  ],
  templateUrl: './origenes-list.component.html',
  styleUrl: './origenes-list.component.scss'
})
export class OrigenesListComponent implements OnInit, OnDestroy {
  arbol: OrigenFondosArbolItemDto[] = [];
  grupos: GrupoOrigenFondos[] = [];
  movimientos: MovimientoOrigenFondosDto[] = [];
  /** Fila de movimiento seleccionada (estilo persistente, no depende del focus). */
  selectedMovimientoId: number | null = null;
  cuentaSeleccionada: OrigenFondosArbolItemDto | null = null;
  loadingCuentas = false;
  loadingMovimientos = false;
  errorCuentas: string | null = null;
  modoEstricto = false;
  esAdmin = false;
  /** Ventas sin corte por metodoPagoId (mismo origen que Cierre de ventas). */
  private ventasSinCortePorMetodo = new Map<number, number>();
  /** Cache localStorage metodos_pago_v2_tickets (vía MetodoPagoService). */
  private metodosPagoPorId = new Map<number, MetodoPagoDto>();
  /** Raíces con hijos expandidos (por defecto colapsados). */
  private gruposExpandidos = new Set<number>();
  periodoSinCorteLabel: string | null = null;

  movimientoColumns = [
    'icono',
    'fecha',
    'tipoMovimiento',
    'valor',
    'impacto',
    'saldoDespues',
    'usuario',
    'detalle'
  ];

  constructor(
    private origenService: OrigenFondosService,
    private movimientoService: MovimientoOrigenFondosService,
    private corteVentaService: CorteVentaService,
    private establecimientoService: EstablecimientoService,
    private metodoPagoService: MetodoPagoService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private footerService: FooterService
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.authService.isAdmin();
    this.actualizarFooterSugerencia();
    this.establecimientoService.loadActual().subscribe({
      next: (est) => {
        this.modoEstricto = !!est.manejoEstrictoCuentas;
      }
    });
    this.cargarIconosMetodosPago();
    this.cargarCuentas();
  }

  ngOnDestroy(): void {
    this.limpiarFooterWarningTimer();
    this.footerService.clearFooterItems();
  }

  /** Usa cache metodos_pago_v2_tickets (mismo origen que el componente métodos de pago). */
  private cargarIconosMetodosPago(): void {
    this.metodoPagoService.obtenerMetodosPagoParaTickets().subscribe({
      next: (metodos) => {
        this.metodosPagoPorId = new Map(
          (metodos ?? []).map((m) => [m.id, m])
        );
      },
      error: () => {
        this.metodosPagoPorId = new Map();
      }
    });
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

  /** Menú ⋮ en todas las cajas excepto «Caja: Efectivo». */
  muestraMenuGestion(cuenta: OrigenFondosArbolItemDto): boolean {
    if (!this.esAdmin || !cuenta?.nombre) {
      return false;
    }
    const n = cuenta.nombre.trim().toLowerCase();
    return n !== 'caja: efectivo' && n !== 'caja efectivo';
  }

  stopCardEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }

  abrirCrearFondoHijo(cuenta: OrigenFondosArbolItemDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.muestraMenuGestion(cuenta)) {
      return;
    }
    // Solo raíces: el árbol UI agrupa un nivel de hijos (como Bancolombia - QR).
    if (cuenta.parentOrigenFondosId != null && !cuenta.esRaiz) {
      this.snackBar.open(
        'Cree fondos hijos desde la caja padre (raíz).',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }
    const ref = this.dialog.open(OrigenHijoDialogComponent, {
      width: '440px',
      data: { parentId: cuenta.id, parentNombre: cuenta.nombre }
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.gruposExpandidos.add(cuenta.id);
        this.cargarCuentas(created.id);
        this.snackBar.open('Fondo hijo creado', undefined, { duration: 2500 });
      }
    });
  }

  confirmarArchivar(cuenta: OrigenFondosArbolItemDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.muestraMenuGestion(cuenta)) {
      return;
    }
    const saldoLedger = cuenta.saldo ?? 0;
    if (saldoLedger !== 0) {
      this.snackBar.open(
        `No se puede archivar «${cuenta.nombre}»: el saldo debe ser $0 (actual: ${saldoLedger}).`,
        'Cerrar',
        { duration: 6000 }
      );
      return;
    }
    const data: ConfirmDialogData = {
      titulo: 'Confirmar archivación',
      mensaje: `¿Archivar el origen de fondos <strong>${cuenta.nombre}</strong>?<br/><br/>Quedará con estado <strong>Archivado</strong> y dejará de mostrarse en el árbol. Solo es posible con saldo 0.`
    };
    this.dialog
      .open(ConfirmDialogComponent, {
        data,
        width: '420px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.origenService.archivar(cuenta.id).subscribe({
          next: () => {
            if (this.cuentaSeleccionada?.id === cuenta.id) {
              this.cuentaSeleccionada = null;
              this.movimientos = [];
            }
            this.cargarCuentas();
            this.snackBar.open(
              `«${cuenta.nombre}» archivado`,
              undefined,
              { duration: 2500 }
            );
          },
          error: (err) => {
            const msg =
              err?.error?.message ||
              err?.error?.errores?.[0]?.descripcionError ||
              'No se pudo archivar el origen.';
            this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
          }
        });
      });
  }

  /** Origen arrastrado actualmente (drag & drop para traslados). */
  origenArrastrado: OrigenFondosArbolItemDto | null = null;
  private footerWarningTimer: ReturnType<typeof setTimeout> | null = null;
  /** Último destino bajo el puntero (por si dropEffect/none no dispara drop). */
  private ultimoDestinoHover: OrigenFondosArbolItemDto | null = null;
  private dropProcesado = false;

  onDragStart(cuenta: OrigenFondosArbolItemDto, event: DragEvent): void {
    if (!this.esAdmin) {
      return;
    }
    this.limpiarFooterWarningTimer();
    this.dropProcesado = false;
    this.ultimoDestinoHover = null;
    this.origenArrastrado = cuenta;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(cuenta.id));
    }
    const tipHijo = this.esOrigenHijo(cuenta)
      ? ` Solo a su padre o hermanos (no a orígenes externos).`
      : '';
    this.actualizarFooterSugerencia(
      `Suelta sobre otra caja para mover saldo desde «${cuenta.nombre}».${tipHijo}`
    );
  }

  onDragOver(destino: OrigenFondosArbolItemDto, event: DragEvent): void {
    if (!this.esAdmin || !this.origenArrastrado) {
      return;
    }
    // Siempre preventDefault + dropEffect move: si usamos "none", muchos
    // navegadores no disparan "drop" y el warning nunca aparece.
    event.preventDefault();
    this.ultimoDestinoHover = destino;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(destino: OrigenFondosArbolItemDto, event: DragEvent): void {
    event.preventDefault();
    this.dropProcesado = true;
    const origen = this.origenArrastrado;
    this.origenArrastrado = null;
    this.ultimoDestinoHover = null;
    if (!this.esAdmin || !origen) {
      this.actualizarFooterSugerencia();
      return;
    }
    if (origen.id === destino.id) {
      this.actualizarFooterSugerencia();
      return;
    }
    if (!this.puedeTrasladarDrag(origen, destino)) {
      this.mostrarFooterWarning(
        `Movimiento de fondo hijo a origen externo no permitido («${origen.nombre}» → «${destino.nombre}»). Use el padre primero.`
      );
      return;
    }
    this.actualizarFooterSugerencia();
    this.abrirTrasladoDragDrop(origen.id, destino.id);
  }

  onDragEnd(): void {
    const origen = this.origenArrastrado;
    const destino = this.ultimoDestinoHover;
    this.origenArrastrado = null;
    this.ultimoDestinoHover = null;

    // Fallback: si no hubo drop (cancelado / dropEffect none) pero soltó sobre inválido.
    if (
      !this.dropProcesado &&
      origen &&
      destino &&
      origen.id !== destino.id &&
      !this.puedeTrasladarDrag(origen, destino)
    ) {
      this.mostrarFooterWarning(
        `Movimiento de fondo hijo a origen externo no permitido («${origen.nombre}» → «${destino.nombre}»). Use el padre primero.`
      );
      this.dropProcesado = false;
      return;
    }

    this.dropProcesado = false;
    if (!this.footerWarningTimer) {
      this.actualizarFooterSugerencia();
    }
  }

  /** Hijo = tiene padre (bolsillo bajo una raíz). */
  private esOrigenHijo(cuenta: OrigenFondosArbolItemDto): boolean {
    return cuenta.parentOrigenFondosId != null && cuenta.parentOrigenFondosId > 0;
  }

  /**
   * Hijo → solo su padre o hermanos.
   * Raíz → cualquier otro origen (incl. hijos propios u otras raíces).
   */
  private puedeTrasladarDrag(
    origen: OrigenFondosArbolItemDto,
    destino: OrigenFondosArbolItemDto
  ): boolean {
    if (origen.id === destino.id) {
      return false;
    }
    if (!this.esOrigenHijo(origen)) {
      return true;
    }
    const padreId = origen.parentOrigenFondosId!;
    if (destino.id === padreId) {
      return true;
    }
    // Hermano: mismo padre
    return destino.parentOrigenFondosId === padreId;
  }

  /**
   * Tips de ayuda en el footer (icono sugerencia).
   * Aparece al entrar a Orígenes; cambia durante drag & drop; se limpia al salir.
   */
  private actualizarFooterSugerencia(mensajeDrag?: string): void {
    this.limpiarFooterWarningTimer();
    const tip: FooterItemDto = mensajeDrag
      ? {
          tipo: 'sugerencia',
          textoClave: 'Arrastrar',
          valorClave: mensajeDrag,
          estiloCssClave: 'footer-sugerencia-activa',
          icono: 'mat:swap_horiz'
        }
      : {
          tipo: 'sugerencia',
          textoClave: 'Sugerencia',
          valorClave: this.esAdmin
            ? 'Clic · Doble clic copia JSON (ficha+movs) · Arrastra para mover saldo (hijo → padre/hermanos)'
            : 'Clic para ver movimientos · Doble clic copia JSON (ficha+movs)',
          estiloCssClave: '',
          icono: 'mat:tips_and_updates'
        };
    this.footerService.setFooterItems([tip]);
  }

  private mostrarFooterWarning(mensaje: string): void {
    this.limpiarFooterWarningTimer();
    this.footerService.setFooterItems([
      {
        tipo: 'warning',
        textoClave: 'No permitido',
        valorClave: mensaje,
        estiloCssClave: '',
        icono: 'mat:warning'
      }
    ]);
    this.footerWarningTimer = setTimeout(() => {
      this.footerWarningTimer = null;
      this.actualizarFooterSugerencia();
    }, 4500);
  }

  private limpiarFooterWarningTimer(): void {
    if (this.footerWarningTimer != null) {
      clearTimeout(this.footerWarningTimer);
      this.footerWarningTimer = null;
    }
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
        arbol: this.arbol,
        ventasSinCortePorMetodo: this.ventasSinCortePorMetodo
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
   * Copia JSON compacto (ficha + movimientos con id) para análisis.
   * Sin usuario; id solo en la copia (no en la tabla UI).
   */
  copiarInfoRaiz(cuenta: OrigenFondosArbolItemDto): void {
    const sv = this.saldoVista(cuenta);
    const ficha: Record<string, unknown> = {
      id: cuenta.id,
      nombre: cuenta.nombreDisplay || cuenta.nombre,
      ledger: Math.round(sv.ledger),
      parcial: Math.round(sv.parcial)
    };
    if (sv.mostrarDesglose) {
      ficha['ticketsSinCorte'] = Math.round(sv.ventasSinCorte);
    }
    this.copiarCuentaConMovimientos(cuenta.id, ficha);
  }

  /** Copia JSON compacto del hijo + movimientos (con id, sin usuario). */
  copiarInfoHijo(hijo: OrigenFondosArbolItemDto): void {
    this.copiarCuentaConMovimientos(hijo.id, {
      id: hijo.id,
      nombre: hijo.nombreDisplay || hijo.nombre,
      saldo: Math.round(hijo.saldo ?? 0)
    });
  }

  private copiarCuentaConMovimientos(
    cuentaId: number,
    ficha: Record<string, unknown>
  ): void {
    this.movimientoService.findByCuenta(cuentaId).subscribe({
      next: (movs) => {
        const ordenados = [...(movs ?? [])].sort(
          (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id
        );
        this.copiarTexto(
          JSON.stringify({
            ...ficha,
            movs: ordenados.map((m) => this.movimientoParaCopia(m))
          })
        );
      },
      error: () =>
        this.copiarTexto(JSON.stringify({ ...ficha, movs: [] }))
    });
  }

  /** Claves cortas + números crudos = menos tokens al pegar en un chat. */
  private movimientoParaCopia(m: MovimientoOrigenFondosDto): Record<string, unknown> {
    const row: Record<string, unknown> = {
      id: m.id,
      f: this.fechaIsoCorta(m.fecha),
      t: m.tipoMovimiento,
      v: Math.round(m.valor ?? 0),
      i: Math.round(m.impacto ?? 0),
      s: Math.round(m.saldoDespues ?? 0)
    };
    const det = this.detalleMovimiento(m);
    if (det && det !== '—') {
      row['d'] = det;
    }
    const ref = m.idReferencia ?? m.origenId;
    if (ref != null) {
      row['ref'] = ref;
    }
    if (m.origenTipo) {
      row['ot'] = m.origenTipo;
    }
    return row;
  }

  private fechaIsoCorta(fecha: string): string {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(fecha);
    return m ? m[1] : fecha;
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
    this.selectedMovimientoId = null;
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

  selectMovimiento(m: MovimientoOrigenFondosDto): void {
    this.selectedMovimientoId = m.id;
  }

  isMovimientoSelected(m: MovimientoOrigenFondosDto): boolean {
    return this.selectedMovimientoId === m.id;
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

  estaExpandido(raizId: number): boolean {
    return this.gruposExpandidos.has(raizId);
  }

  toggleHijos(raizId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.gruposExpandidos.has(raizId)) {
      this.gruposExpandidos.delete(raizId);
    } else {
      this.gruposExpandidos.add(raizId);
    }
  }

  /** Iniciales para el avatar redondo del bolsillo. */
  inicialesOrigen(nombre: string | null | undefined): string {
    const parts = (nombre ?? '')
      .replace(/[:\-_/]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (nombre ?? '?').slice(0, 2).toUpperCase();
  }

  /**
   * Icono del método de pago (assets/img/icons/payments/{file}).
   * Si el OF no tiene MP o no hay file en cache, retorna null → iniciales.
   */
  iconoMetodoPagoUrl(cuenta: OrigenFondosArbolItemDto): string | null {
    const mpId = cuenta.metodoPagoId;
    if (mpId == null) {
      return null;
    }
    const file = this.metodosPagoPorId.get(mpId)?.file?.trim();
    if (!file) {
      return null;
    }
    return `assets/img/icons/payments/${file}`;
  }

  iconoTipoMovimiento(tipo: string): string {
    const map: Record<string, string> = {
      ENTRADA_MANUAL: 'mat:add_circle',
      ENTRADA_PRESTAMO: 'mat:handshake',
      ENTRADA_VENTA: 'mat:point_of_sale',
      TRASLADO: 'mat:swap_horiz',
      SALIDA_EGRESO: 'mat:money_off',
      SALIDA_DEVOLUCION_PRESTAMO: 'mat:undo',
      AJUSTE_SALDO: 'mat:tune',
      AJUSTE_CIERRE: 'mat:balance',
      REVERSO_AJUSTE_CIERRE: 'mat:undo',
      REVERSO_ENTRADA_VENTA: 'mat:undo'
    };
    return map[tipo] ?? 'mat:receipt_long';
  }

  tipoMovimientoLabel(tipo: string): string {
    const map: Record<string, string> = {
      ENTRADA_MANUAL: 'Entrada manual',
      ENTRADA_PRESTAMO: 'Préstamo',
      ENTRADA_VENTA: 'Entrada venta',
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

  /**
   * id_referencia + origen_tipo con documento consultable.
   * No aplica a traslados de Distribución de efectivo (DISTRIBUCION): no hay modal útil.
   */
  tieneReferenciaVer(m: MovimientoOrigenFondosDto): boolean {
    const id = m.idReferencia ?? m.origenId;
    if (id == null) {
      return false;
    }
    const tipo = (m.origenTipo ?? '').toUpperCase();
    return (
      tipo === 'EGRESO' ||
      tipo === 'EGRESO_REVERSION' ||
      tipo === 'CORTE_VENTA' ||
      tipo === 'CORTE_VENTA_REVERSO' ||
      tipo === 'CIERRE' ||
      tipo === 'CIERRE_REVERSO'
    );
  }

  /** Nombre corto del usuario del movimiento: "Carlos Romero" → "Carlos R." */
  nombreUsuarioMovimiento(m: MovimientoOrigenFondosDto): string {
    const id = m.usuarioId?.trim();
    if (!id) {
      return '—';
    }
    const u = this.authService
      .obtenerTodosUsuariosCache()
      .find((x) => x.id === id);
    const nombre = u?.nombre?.trim() || id;
    return this.abreviarNombreUsuario(nombre);
  }

  private abreviarNombreUsuario(nombre: string): string {
    const palabras = nombre.trim().split(/\s+/).filter(Boolean);
    if (palabras.length <= 1) {
      return nombre.trim();
    }
    return `${palabras[0]} ${palabras[1].charAt(0).toUpperCase()}.`;
  }

  verReferencia(m: MovimientoOrigenFondosDto, event?: Event): void {
    event?.stopPropagation();
    const id = m.idReferencia ?? m.origenId;
    if (id == null || !m.origenTipo || !this.tieneReferenciaVer(m)) {
      return;
    }
    const tipo = m.origenTipo.toUpperCase();
    const esCorte = [
      'CORTE_VENTA',
      'CORTE_VENTA_REVERSO',
      'CIERRE',
      'CIERRE_REVERSO'
    ].includes(tipo);
    this.dialog.open(MovimientoReferenciaDialogComponent, {
      width: esCorte ? '920px' : '520px',
      maxWidth: '96vw',
      data: {
        origenTipo: m.origenTipo,
        idReferencia: id,
        usuarioId: m.usuarioId ?? null
      }
    });
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
        arbol: this.arbol,
        ventasSinCortePorMetodo: this.ventasSinCortePorMetodo
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
