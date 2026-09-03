import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../../auth/service/auth.service';
import {
  AyudaEnLineaPanelComponent,
  AyudaEnLineaContenido
} from '../../../../../core/components/ayuda-en-linea';
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
  TicketsSinCorteDialogComponent,
  TicketsSinCorteDialogData
} from '../tickets-sin-corte-dialog/tickets-sin-corte-dialog.component';
import {
  EgresoEditComponent
} from '../../egresos/egreso-edit/egreso-edit.component';
import {
  FormalizarEgresoDialogData
} from '../../egresos/service/egresos.service';
import {
  agruparOrigenesArbol,
  OrigenFondosArbolItemDto,
  GrupoOrigenFondos,
  SaldoOfVista,
  mapVentasSinCortePorMetodo,
  saldoOrigenConVentasSinCorte,
  paramsConsultarRangoHastaAhora
} from '../util/origen-fondos-arbol.util';
import {
  labelClasificacionOperativa,
  sugerirClasificacionDesdeOf
} from '../util/clasificacion-operativa.util';
import {
  destinosPermitidosTraslado,
  puedeTrasladarEntreOf
} from '../util/traslado-of.util';
import { ClasificacionOperativaReporteDialogComponent } from '../clasificacion-operativa-reporte-dialog/clasificacion-operativa-reporte-dialog.component';
import { FooterService } from '../../../../../layouts/services/footer.service';
import { FooterItemDto } from '../../../../../layouts/components/footer/footer.component';
import { GestionNotificacionesMediosService } from '../../../ventas/service/gestion-notificaciones-medios.service';
import type { PlantillaNotificacionPagoDto } from '../../../ventas/service/gestion-notificaciones-medios.service';

const NAV_FLASH_MS = 1800;

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
    MatTableModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    AyudaEnLineaPanelComponent
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
  /** Resaltado temporal al navegar Atrás/Adelante entre patas de un traslado. */
  cuentaResaltadaId: number | null = null;
  movimientoResaltadoId: number | null = null;
  private navFlashTimer: ReturnType<typeof setTimeout> | null = null;
  cuentaSeleccionada: OrigenFondosArbolItemDto | null = null;
  loadingCuentas = false;
  loadingMovimientos = false;
  errorCuentas: string | null = null;
  modoEstricto = false;
  esAdmin = false;
  ayudaAbierta = false;
  readonly ayudaContenido: AyudaEnLineaContenido = {
    titulo: 'Orígenes de fondos',
    resumen:
      'Medios de pago y orígenes hijos — mueva saldo entre cuentas y revise movimientos.',
    tips: [
      'Clic en una tarjeta o fila para ver movimientos.',
      'Admin: arrastra y suelta entre cajas o filas para trasladar.',
      'Doble clic copia JSON (ficha + movimientos) al portapapeles.'
    ],
    acciones: [
      {
        titulo: 'Consultar tickets sin corte',
        detalle:
          'Desde el medio (p. ej. QR/Nequi) abre las ventas del turno aún no incluidas en un cierre.'
      },
      {
        titulo: 'Ver movimientos del método / bolsillo',
        detalle:
          'Selecciona un origen para listar entradas, salidas, traslados y ajustes del ledger.'
      },
      {
        titulo: 'Consultar saldo de orígenes',
        detalle:
          'Incluye caja menor, sin clasificar y otros bolsillos hijos; el saldo se ve en cada tarjeta.'
      },
      {
        titulo: 'Trasladar / entrada / préstamo / ajuste',
        detalle:
          'Botones de admin para mover saldo o registrar movimientos sin pasar por una venta.'
      },
      {
        titulo: 'Navegar Atrás / Adelante en traslados',
        detalle:
          'En un movimiento de traslado puedes saltar a la pata origen o destino del mismo flujo.'
      },
      {
        titulo: 'Formalizar egreso desde un movimiento',
        detalle:
          'Cuando aplique, convierte un movimiento de bolsillo en documento de egreso.'
      }
    ]
  };
  private readonly resumenPantalla = this.ayudaContenido.resumen;
  /** Ventas sin corte por metodoPagoId (mismo origen que Cierre de ventas). */
  private ventasSinCortePorMetodo = new Map<number, number>();
  /** Cache localStorage metodos_pago_v2_tickets (vía MetodoPagoService). */
  private metodosPagoPorId = new Map<number, MetodoPagoDto>();
  /** Raíces con hijos expandidos. Por defecto colapsados; se abren si una plantilla apunta a un hijo. */
  private gruposExpandidos = new Set<number>();
  periodoSinCorteLabel: string | null = null;

  movimientoColumns = [
    'icono',
    'fecha',
    'tipoMovimiento',
    'valor',
    'impacto',
    'saldoDespues',
    'clasificacion',
    'usuario',
    'detalle'
  ];

  constructor(
    private origenService: OrigenFondosService,
    private movimientoService: MovimientoOrigenFondosService,
    private corteVentaService: CorteVentaService,
    private establecimientoService: EstablecimientoService,
    private metodoPagoService: MetodoPagoService,
    private notificacionesMediosService: GestionNotificacionesMediosService,
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
    this.limpiarFooterHoverTimer();
    this.limpiarNavFlashTimer();
    this.ayudaAbierta = false;
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
      ),
      plantillas: this.notificacionesMediosService.listarPlantillas().pipe(
        catchError(() => of([] as PlantillaNotificacionPagoDto[]))
      )
    }).subscribe({
      next: ({ arbol, rango, plantillas }) => {
        this.arbol = arbol ?? [];
        this.aplicarVentasSinCorte(rango);
        this.grupos = agruparOrigenesArbol(this.arbol);
        this.expandirGruposPorDestinoPlantillas(plantillas);
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

  /** Raíz con medio de Tickets y desglose de tickets sin corte. */
  puedeAbrirTicketsSinCorte(cuenta: OrigenFondosArbolItemDto): boolean {
    const mpId = cuenta.metodoPagoId;
    if (mpId == null || !this.metodosPagoPorId.has(mpId)) {
      return false;
    }
    return this.saldoVista(cuenta).mostrarDesglose;
  }

  abrirTicketsSinCorte(
    cuenta: OrigenFondosArbolItemDto,
    event: Event
  ): void {
    event.stopPropagation();
    event.preventDefault();
    const mpId = cuenta.metodoPagoId;
    if (mpId == null) {
      return;
    }
    const sv = this.saldoVista(cuenta);
    const mp = this.metodosPagoPorId.get(mpId);
    const nombre =
      mp?.descripcion?.trim() || cuenta.nombre || `Medio ${mpId}`;
    const data: TicketsSinCorteDialogData = {
      metodoPagoId: mpId,
      metodoPagoNombre: nombre,
      metodoPagoColor: mp?.color?.trim() || cuenta.color?.trim() || null,
      totalTicketsSinCorte: sv.ventasSinCorte
    };
    this.dialog.open(TicketsSinCorteDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data
    });
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
  /** Movimiento (entrada +) arrastrado hacia otro OF para reclasificar. */
  movimientoArrastrado: MovimientoOrigenFondosDto | null = null;
  private footerWarningTimer: ReturnType<typeof setTimeout> | null = null;
  private footerHoverTimer: ReturnType<typeof setTimeout> | null = null;
  private footerHoverActivo = false;
  /** Último destino bajo el puntero (por si dropEffect/none no dispara drop). */
  private ultimoDestinoHover: OrigenFondosArbolItemDto | null = null;
  private dropProcesado = false;

  onDragStart(cuenta: OrigenFondosArbolItemDto, event: DragEvent): void {
    if (!this.esAdmin) {
      return;
    }
    this.limpiarFooterHoverTimer();
    this.footerHoverActivo = false;
    this.limpiarFooterWarningTimer();
    this.dropProcesado = false;
    this.ultimoDestinoHover = null;
    this.movimientoArrastrado = null;
    this.origenArrastrado = cuenta;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `of:${cuenta.id}`);
    }
    const tipHijo = this.esOrigenHijo(cuenta)
      ? ` Destino: padres de caja (efectivo) u otros OF permitidos.`
      : '';
    this.actualizarFooterSugerencia(
      `Suelta sobre otra caja para mover saldo desde «${cuenta.nombre}».${tipHijo}`
    );
  }

  onDragStartMovimiento(m: MovimientoOrigenFondosDto, event: DragEvent): void {
    if (!this.esAdmin || !this.puedeArrastrarMovimiento(m)) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    this.limpiarFooterHoverTimer();
    this.footerHoverActivo = false;
    this.limpiarFooterWarningTimer();
    this.dropProcesado = false;
    this.ultimoDestinoHover = null;
    this.origenArrastrado = null;
    this.movimientoArrastrado = m;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `mov:${m.id}`);
    }
    this.actualizarFooterSugerencia(
      `Suelta sobre un OF permitido para trasladar ${this.formatCurrencyShort(m.valor)} (p.ej. Caja Efectivo / Caja General).`
    );
  }

  puedeArrastrarMovimiento(m: MovimientoOrigenFondosDto): boolean {
    return this.esAdmin && (m.impacto ?? 0) > 0;
  }

  puedeTrasladarMovimiento(m: MovimientoOrigenFondosDto): boolean {
    if (!this.puedeArrastrarMovimiento(m)) {
      return false;
    }
    const origenId = this.cuentaSeleccionada?.id ?? m.origenFondosId;
    const origen = this.arbol.find((c) => c.id === origenId);
    if (!origen) {
      return false;
    }
    return destinosPermitidosTraslado(origen, this.arbol).length > 0;
  }

  /**
   * Abre el diálogo de traslado (retiro cajero/sucursal → caja física, u otro OF permitido).
   */
  trasladarMovimiento(m: MovimientoOrigenFondosDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeTrasladarMovimiento(m)) {
      return;
    }
    const origenId = this.cuentaSeleccionada?.id ?? m.origenFondosId;
    const origen = this.arbol.find((c) => c.id === origenId);
    if (!origen) {
      return;
    }
    const destinos = destinosPermitidosTraslado(origen, this.arbol);
    if (destinos.length === 0) {
      this.snackBar.open('No hay destinos permitidos para este origen', 'Cerrar', {
        duration: 4000
      });
      return;
    }
    const valor = Math.abs(Number(m.valor) || Number(m.impacto) || 0);
    const unico = destinos.length === 1 ? destinos[0] : null;
    const sugerida = unico
      ? sugerirClasificacionDesdeOf(unico.nombre)
      : null;
    const ref = this.dialog.open(OrigenMovimientoDialogComponent, {
      width: '520px',
      data: {
        tipo: 'traslado' as OrigenMovimientoTipo,
        cuentaId: origen.id,
        destinoId: unico?.id,
        arbol: this.arbol,
        ventasSinCortePorMetodo: this.ventasSinCortePorMetodo,
        valor,
        clasificacionOperativa: sugerida,
        pedirClasificacion: false,
        bloquearOrigen: true,
        titulo: 'Trasladar'
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cargarCuentas(this.cuentaSeleccionada?.id);
        this.snackBar.open('Traslado registrado', undefined, { duration: 2500 });
      }
    });
  }

  /**
   * Entrada «por identificar» (email → Para ordenar): formalizar como egreso
   * sin volver a restar el banco.
   */
  puedeFormalizarEgreso(m: MovimientoOrigenFondosDto): boolean {
    if ((m.impacto ?? 0) <= 0 || m.id == null) {
      return false;
    }
    const tipo = (m.origenTipo ?? '').trim().toUpperCase();
    return tipo === 'MOVIMIENTO BANCO POR IDENTIFICAR';
  }

  formalizarEgreso(m: MovimientoOrigenFondosDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeFormalizarEgreso(m)) {
      return;
    }
    const data: FormalizarEgresoDialogData = {
      mode: 'formalizar',
      fromMovimientoOrigenFondosId: m.id,
      origenFondosId: m.origenFondosId,
      valor: m.valor,
      terceroNombre: m.terceroNombre,
      idReferencia: m.idReferencia ?? null
    };
    const dialogRef = this.dialog.open(EgresoEditComponent, {
      width: '600px',
      data
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Egreso formalizado', 'Cerrar', { duration: 3500 });
        this.cargarCuentas();
        if (this.cuentaSeleccionada) {
          this.cargarMovimientos(this.cuentaSeleccionada.id);
        }
      }
    });
  }

  /**
   * Mismo caso que Formalizar: entrada por identificar en la bolsa.
   * Requiere que exista el OF «Cuenta del dueño» en el árbol.
   */
  puedeClasificarCuentaDueno(m: MovimientoOrigenFondosDto): boolean {
    return this.puedeFormalizarEgreso(m) && this.findCuentaDelDueno() != null;
  }

  /**
   * Equivale a arrastrar la fila (+) → Cuenta del dueño (clasif. personal).
   */
  clasificarACuentaDueno(m: MovimientoOrigenFondosDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeClasificarCuentaDueno(m)) {
      return;
    }
    const destino = this.findCuentaDelDueno();
    if (!destino) {
      this.snackBar.open(
        'No se encontró el OF «Cuenta del dueño»',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }
    this.abrirTrasladoDesdeMovimiento(m, destino);
  }

  /** OF destino personal (mismo criterio que legalizar email). */
  private findCuentaDelDueno(): OrigenFondosArbolItemDto | undefined {
    const exact = (nombre: string) =>
      this.arbol.find(
        (c) => (c.nombre || '').trim().toLowerCase() === nombre.toLowerCase()
      );
    const like = (frag: string) =>
      this.arbol.find((c) =>
        (c.nombre || '').toLowerCase().includes(frag.toLowerCase())
      );
    return (
      exact('Cuenta del dueño') ||
      exact('Cuenta del dueno') ||
      exact('Personal administrador') ||
      like('cuenta del dueño') ||
      like('cuenta del dueno') ||
      this.arbol.find((c) => sugerirClasificacionDesdeOf(c.nombre) === 'CUENTA_PERSONAL')
    );
  }

  onDragOver(destino: OrigenFondosArbolItemDto, event: DragEvent): void {
    if (!this.esAdmin || (!this.origenArrastrado && !this.movimientoArrastrado)) {
      return;
    }
    event.preventDefault();
    this.ultimoDestinoHover = destino;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(destino: OrigenFondosArbolItemDto, event: DragEvent): void {
    event.preventDefault();
    this.dropProcesado = true;
    const mov = this.movimientoArrastrado;
    const origen = this.origenArrastrado;
    this.origenArrastrado = null;
    this.movimientoArrastrado = null;
    this.ultimoDestinoHover = null;

    if (!this.esAdmin) {
      this.actualizarFooterSugerencia();
      return;
    }

    if (mov) {
      this.actualizarFooterSugerencia();
      if (!this.puedeTrasladarMovimientoA(mov, destino)) {
        this.mostrarFooterWarning(
          `No se puede trasladar ese movimiento a «${destino.nombre}».`
        );
        return;
      }
      this.abrirTrasladoDesdeMovimiento(mov, destino);
      return;
    }

    if (!origen) {
      this.actualizarFooterSugerencia();
      return;
    }
    if (origen.id === destino.id) {
      this.actualizarFooterSugerencia();
      return;
    }
    if (!this.puedeTrasladarDrag(origen, destino)) {
      this.mostrarFooterWarning(
        `Traslado no permitido («${origen.nombre}» → «${destino.nombre}»).`
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
    this.movimientoArrastrado = null;
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
        `Traslado no permitido («${origen.nombre}» → «${destino.nombre}»).`
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
   * Electrónico (hijo/raíz) → padres no electrónicos (cajas).
   * No electrónico → otros OF físicos (padres e hijos).
   */
  private puedeTrasladarDrag(
    origen: OrigenFondosArbolItemDto,
    destino: OrigenFondosArbolItemDto
  ): boolean {
    return puedeTrasladarEntreOf(origen, destino, this.arbol);
  }

  private puedeTrasladarMovimientoA(
    m: MovimientoOrigenFondosDto,
    destino: OrigenFondosArbolItemDto
  ): boolean {
    const origenId = this.cuentaSeleccionada?.id ?? m.origenFondosId;
    const origen = this.arbol.find((c) => c.id === origenId);
    if (!origen) {
      return false;
    }
    return puedeTrasladarEntreOf(origen, destino, this.arbol);
  }

  /**
   * Texto base en la barra de estado (footer). Sin etiqueta «Sugerencia».
   * Durante drag muestra pista; hover de controles usa mostrarTipFooter.
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
          textoClave: '',
          valorClave: this.resumenPantalla,
          estiloCssClave: '',
          icono: 'mat:info'
        };
    this.footerService.setFooterItems([tip]);
  }

  abrirAyudaEnLinea(): void {
    this.ayudaAbierta = true;
    this.footerService.setFooterItems([
      {
        tipo: 'sugerencia',
        textoClave: '',
        valorClave: this.resumenPantalla,
        estiloCssClave: '',
        icono: 'mat:info'
      }
    ]);
  }

  cerrarAyudaEnLinea(): void {
    this.ayudaAbierta = false;
    if (!this.footerHoverActivo && !this.origenArrastrado && !this.movimientoArrastrado) {
      this.actualizarFooterSugerencia();
    }
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

  tooltipExpandHijos(grupo: GrupoOrigenFondos): string {
    return this.estaExpandido(grupo.raiz.id)
      ? 'Ocultar bolsillos'
      : `Ver bolsillos (${grupo.hijos.length})`;
  }

  /**
   * Muestra ayuda en el footer. Si hay título (p.ej. nombre del botón) se muestra
   * como «Título : descripción»; si no, solo el texto completo (sin «Ayuda»).
   */
  mostrarTipFooter(texto: string | null | undefined, titulo?: string | null): void {
    if (this.origenArrastrado || this.movimientoArrastrado) {
      return;
    }
    const t = (texto ?? '').replace(/\s+/g, ' ').trim();
    if (!t || t === '—') {
      return;
    }
    this.limpiarFooterHoverTimer();
    this.footerHoverActivo = true;
    this.limpiarFooterWarningTimer();
    const label = (titulo ?? '').trim();
    this.footerService.setFooterItems([
      {
        tipo: 'sugerencia',
        textoClave: label ? `${label}:` : '',
        valorClave: t,
        estiloCssClave: '',
        icono: 'mat:info'
      }
    ]);
  }

  onDetalleBotonLeave(m: MovimientoOrigenFondosDto, event: MouseEvent): void {
    const related = event.relatedTarget as Node | null;
    const cell = (event.currentTarget as HTMLElement | null)?.closest?.(
      '.detalle-cell'
    );
    if (cell && related && cell.contains(related)) {
      this.mostrarTipFooter(this.detalleMovimiento(m));
      return;
    }
    this.ocultarTipFooter();
  }

  ocultarTipFooter(): void {
    if (!this.footerHoverActivo) {
      return;
    }
    this.limpiarFooterHoverTimer();
    this.footerHoverTimer = setTimeout(() => {
      this.footerHoverTimer = null;
      this.footerHoverActivo = false;
      if (this.origenArrastrado || this.movimientoArrastrado) {
        return;
      }
      this.actualizarFooterSugerencia();
    }, 80);
  }

  private limpiarFooterHoverTimer(): void {
    if (this.footerHoverTimer != null) {
      clearTimeout(this.footerHoverTimer);
      this.footerHoverTimer = null;
    }
  }

  /**
   * Abre el modal de traslado con origen y destino ya seleccionados
   * (resultado de arrastrar una caja sobre otra).
   */
  private abrirTrasladoDragDrop(origenId: number, destinoId: number): void {
    const dest = this.arbol.find((c) => c.id === destinoId);
    const sugerida = sugerirClasificacionDesdeOf(dest?.nombre);
    const ref = this.dialog.open(OrigenMovimientoDialogComponent, {
      width: '520px',
      data: {
        tipo: 'traslado' as OrigenMovimientoTipo,
        cuentaId: origenId,
        destinoId,
        arbol: this.arbol,
        ventasSinCortePorMetodo: this.ventasSinCortePorMetodo,
        clasificacionOperativa: sugerida,
        pedirClasificacion: !!sugerida,
        titulo: 'Trasladar'
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
   * Reclasifica saldo: arrastrar una entrada (+) de la tabla hacia otro OF.
   * Origen = cuenta seleccionada; destino = drop; clasificación sugerida por nombre OF.
   */
  private abrirTrasladoDesdeMovimiento(
    m: MovimientoOrigenFondosDto,
    destino: OrigenFondosArbolItemDto
  ): void {
    const origenId = this.cuentaSeleccionada?.id ?? m.origenFondosId;
    if (origenId == null) {
      this.snackBar.open('Seleccione la cuenta origen', 'Cerrar', { duration: 3000 });
      return;
    }
    if (origenId === destino.id) {
      this.snackBar.open('Suelte en un OF distinto al actual', 'Cerrar', {
        duration: 3000
      });
      return;
    }
    if (!this.puedeTrasladarMovimientoA(m, destino)) {
      this.mostrarFooterWarning(
        `No se puede trasladar a «${destino.nombre}».`
      );
      return;
    }
    const valor = Math.abs(Number(m.valor) || Number(m.impacto) || 0);
    if (!(valor > 0)) {
      this.snackBar.open('El movimiento no tiene valor arrastrable', 'Cerrar', {
        duration: 3000
      });
      return;
    }
    const sugerida =
      sugerirClasificacionDesdeOf(destino.nombre) || 'OTRO_LEGALIZADO';
    const ref = this.dialog.open(OrigenMovimientoDialogComponent, {
      width: '520px',
      data: {
        tipo: 'traslado' as OrigenMovimientoTipo,
        cuentaId: origenId,
        destinoId: destino.id,
        arbol: this.arbol,
        ventasSinCortePorMetodo: this.ventasSinCortePorMetodo,
        valor,
        clasificacionOperativa: sugerida,
        pedirClasificacion: true,
        bloquearOrigen: true,
        titulo: 'Trasladar'
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cargarCuentas(this.cuentaSeleccionada?.id);
        this.snackBar.open('Reclasificación registrada', undefined, {
          duration: 2500
        });
      }
    });
  }

  abrirReporteClasificacion(): void {
    this.dialog.open(ClasificacionOperativaReporteDialogComponent, {
      width: '920px',
      maxWidth: '95vw'
    });
  }

  labelClasificacion(codigo: string | null | undefined): string {
    return labelClasificacionOperativa(codigo);
  }

  private formatCurrencyShort(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(valor) || 0);
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

  cargarMovimientos(cuentaId: number, highlightMovimientoId?: number): void {
    this.loadingMovimientos = true;
    this.selectedMovimientoId = null;
    this.movimientoService.findByCuenta(cuentaId).subscribe({
      next: (movs) => {
        this.movimientos = [...movs].sort(
          (a, b) => b.fecha.localeCompare(a.fecha) || (b.id - a.id)
        );
        this.loadingMovimientos = false;
        if (highlightMovimientoId != null) {
          this.aplicarResaltadoNavegacion(cuentaId, highlightMovimientoId);
        }
      },
      error: () => {
        this.loadingMovimientos = false;
        this.movimientos = [];
      }
    });
  }

  /** Salida (impacto &lt; 0) → ir al OF de la entrada del mismo grupo. */
  puedeNavegarTrasladoAdelante(m: MovimientoOrigenFondosDto): boolean {
    return !!m.grupoTrasladoId && (m.impacto ?? 0) < 0;
  }

  /** Entrada (impacto &gt; 0) → ir al OF de la salida del mismo grupo. */
  puedeNavegarTrasladoAtras(m: MovimientoOrigenFondosDto): boolean {
    return !!m.grupoTrasladoId && (m.impacto ?? 0) > 0;
  }

  navegarTraslado(
    m: MovimientoOrigenFondosDto,
    direccion: 'adelante' | 'atras',
    event?: Event
  ): void {
    event?.stopPropagation();
    event?.preventDefault();
    const grupoId = m.grupoTrasladoId?.trim();
    if (!grupoId) {
      return;
    }
    if (direccion === 'adelante' && !this.puedeNavegarTrasladoAdelante(m)) {
      return;
    }
    if (direccion === 'atras' && !this.puedeNavegarTrasladoAtras(m)) {
      return;
    }
    this.movimientoService.findByGrupoTrasladoId(grupoId).subscribe({
      next: (patas) => {
        const hermano = (patas ?? []).find((p) => p.id !== m.id);
        if (!hermano?.origenFondosId) {
          this.snackBar.open(
            'No se encontró el movimiento vinculado.',
            'Cerrar',
            { duration: 3500 }
          );
          return;
        }
        const cuenta = this.arbol.find((c) => c.id === hermano.origenFondosId);
        if (!cuenta) {
          this.snackBar.open(
            'El OF vinculado no está visible en el árbol.',
            'Cerrar',
            { duration: 4000 }
          );
          return;
        }
        if (cuenta.parentOrigenFondosId != null && cuenta.parentOrigenFondosId > 0) {
          this.gruposExpandidos.add(cuenta.parentOrigenFondosId);
        }
        this.cuentaSeleccionada = cuenta;
        this.cargarMovimientos(cuenta.id, hermano.id);
      },
      error: () => {
        this.snackBar.open(
          'No se pudo cargar el par del traslado.',
          'Cerrar',
          { duration: 4000 }
        );
      }
    });
  }

  private aplicarResaltadoNavegacion(
    cuentaId: number,
    movimientoId: number
  ): void {
    this.cuentaResaltadaId = cuentaId;
    this.movimientoResaltadoId = movimientoId;
    this.selectedMovimientoId = movimientoId;
    this.limpiarNavFlashTimer();
    this.navFlashTimer = setTimeout(() => {
      this.cuentaResaltadaId = null;
      this.movimientoResaltadoId = null;
      this.navFlashTimer = null;
    }, NAV_FLASH_MS);
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-of-id="${cuentaId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      document
        .querySelector(`[data-mov-id="${movimientoId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  private limpiarNavFlashTimer(): void {
    if (this.navFlashTimer != null) {
      clearTimeout(this.navFlashTimer);
      this.navFlashTimer = null;
    }
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

  /**
   * Si una plantilla de extracción tiene destino = OF hijo, expandir su raíz
   * para que «Sin Clasificar» (u otros bolsillos) se vean al entrar a Orígenes.
   */
  private expandirGruposPorDestinoPlantillas(
    plantillas: PlantillaNotificacionPagoDto[] | null | undefined
  ): void {
    if (!plantillas?.length || !this.arbol.length) {
      return;
    }
    const porId = new Map(this.arbol.map((c) => [c.id, c]));
    for (const p of plantillas) {
      const destId = p.origenFondosDestinoId;
      if (destId == null) {
        continue;
      }
      const dest = porId.get(destId);
      const padreId = dest?.parentOrigenFondosId;
      if (padreId != null && padreId > 0) {
        this.gruposExpandidos.add(padreId);
      }
    }
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

  tipoMovimientoLabel(tipo: string, origenTipo?: string | null): string {
    if (origenTipo === 'QR_MONTO_DISTINTO') {
      if (tipo === 'AJUSTE_SALDO' || tipo === 'ENTRADA_MANUAL') {
        return 'Ajuste QR';
      }
      if (tipo === 'SALIDA_EGRESO') {
        return 'Devolución QR';
      }
    }
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
        ventasSinCortePorMetodo: this.ventasSinCortePorMetodo,
        titulo: tipo === 'traslado' ? 'Trasladar' : undefined
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
