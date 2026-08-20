import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../auth/service/auth.service';
import {
  ApexOptions,
  VexChartComponent
} from '@vex/components/vex-chart/vex-chart.component';
import { defaultChartOptions } from '@vex/utils/default-chart-options';
import {
  MetodoPagoService,
  MetodoPagoDto
} from '../../ventas/service/metodo-pago.service';
import {
  CorteVentaService,
  CorteVentaSearchItemDto
} from '../../ventas/service/corte-venta.service';
import { Subject, Observable, of } from 'rxjs';
import {
  takeUntil,
  switchMap,
  catchError,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { VexConfigService } from '@vex/config/vex-config.service';
import { VexColorScheme } from '@vex/config/vex-config.interface';
import { CierreVentasComponent } from './cierre-ventas/cierre-ventas.component';
import { CierreRevisionComponent } from './cierre-revision/cierre-revision.component';
import {
  DistribucionEfectivoDialogComponent,
  DistribucionEfectivoDialogResult
} from './distribucion-efectivo-dialog/distribucion-efectivo-dialog.component';
import { MovimientoReferenciaDialogComponent } from '../origenes-fondos/movimiento-referencia-dialog/movimiento-referencia-dialog.component';
import { SesionesService } from '../../ventas/service/sesiones.service';
import { Router } from '@angular/router';

interface VentasPorFecha {
  fecha: string;
  /** Clave YYYY-MM-DD para agrupar / track. */
  fechaKey: string;
  total: number;
  cantidadCortes: number;
  /** Ids de corte_venta del día (para modal Ver). */
  corteIds: number[];
  detalles: {
    metodoPagoId: number;
    metodoPagoNombre: string;
    total: number;
  }[];
}

interface CortesPorDiaGrupo {
  fechaKey: string;
  fechaLabel: string;
  totalVentas: number;
  detalles: {
    metodoPagoId: number;
    metodoPagoNombre: string;
    total: number;
  }[];
  cortes: CorteVentaSearchItemDto[];
}

@Component({
  selector: 'vex-ingresos',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    VexChartComponent
  ],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss']
})
export class IngresosComponent implements OnInit, OnDestroy {
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);
  periodoCtrl = new FormControl<string>('semanal');
  /** Vista del panel derecho: gráfico + detalle por fecha, o listado crudo de cortes. */
  vistaCtrl = new FormControl<'dashboard' | 'corte'>('dashboard');

  ventasPorFecha: VentasPorFecha[] = [];
  ventasPorFechaVisibles: VentasPorFecha[] = [];
  /** Fila activa en Detalles por Fecha mientras el modal de cortes está abierto. */
  fechaSeleccionadaKey: string | null = null;
  /** Respuesta cruda de search (sin agrupar); modo "Datos corte de ventas". */
  cortesVentaListado: CorteVentaSearchItemDto[] = [];
  /** Vista datos: cortes agrupados por día con subtotal de ventas. */
  cortesPorDia: CortesPorDiaGrupo[] = [];
  todosCortesVenta: CorteVentaSearchItemDto[] = [];
  estadoCorteCtrl = new FormControl<
    'vigentes' | 'creada' | 'revisada' | 'eliminado' | 'todos'
  >('vigentes');
  esAdmin = false;
  eliminandoCorteId: number | null = null;
  loading = false;
  error: string | null = null;

  metodosPago: MetodoPagoDto[] = [];
  totalGeneral = 0;
  promedioVentas = 0;
  ventasDiaActual = 0;

  fechaInicioActual: Date | null = null;
  fechaFinActual: Date | null = null;
  diasVisibles = 7;

  leftPanelWidth = 220;
  isResizing = false;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  filtrosOcultos = false;
  private leftPanelWidthAnterior = 220;

  chartSeries: ApexAxisChartSeries = [];
  chartOptions: ApexOptions = defaultChartOptions({
    grid: {
      show: true,
      strokeDashArray: 3,
      padding: {
        left: 16
      }
    },
    chart: {
      type: 'bar',
      height: 300,
      stacked: true,
      sparkline: {
        enabled: false
      },
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        dataLabels: {
          position: 'top',
          total: {
            enabled: true,
            formatter: (val?: string) => {
              if (!val) return '';
              const numVal = parseFloat(val);
              if (isNaN(numVal)) return '';

              const periodo = this.periodoCtrl.value;
              if (periodo === 'mensual') {
                return this.formatCurrencyEnMillones(numVal);
              } else {
                return this.formatCurrencyCompletoConApostrofe(numVal);
              }
            },
            style: {
              fontSize: '12px',
              fontWeight: 600
            }
          }
        }
      }
    },
    xaxis: {
      type: 'category',
      labels: {
        show: true,
        rotate: -45,
        rotateAlways: false
      }
    },
    yaxis: {
      labels: {
        show: true
      }
    },
    legend: {
      show: true,
      position: 'top',
      itemMargin: {
        horizontal: 16,
        vertical: 8
      },
      fontSize: '14px',
      fontFamily: 'inherit'
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      x: {
        formatter: (val: number, opts?: any) => {
          const categoria = opts?.w?.globals?.categoryLabels?.[val];
          return categoria ?? (val != null ? String(val) : '');
        }
      },
      y: {
        formatter: (value: number) => {
          return this.formatCurrency(value);
        }
      }
    }
  });

  private destroy$ = new Subject<void>();
  private chartDarkMode = false;

  constructor(
    private corteVentaService: CorteVentaService,
    private metodoPagoService: MetodoPagoService,
    private dialog: MatDialog,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private sesionesService: SesionesService,
    private router: Router,
    private configService: VexConfigService
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.authService.isAdmin();
    const periodoInicial = this.periodoCtrl.value || 'semanal';
    this.diasVisibles = this.obtenerDiasPorPeriodo(periodoInicial);

    this.configService.config$
      .pipe(
        map((c) => c.style.colorScheme === VexColorScheme.DARK),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((isDark) => this.applyChartColorScheme(isDark));

    this.periodoCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((periodo) => {
        if (periodo) {
          this.diasVisibles = this.obtenerDiasPorPeriodo(periodo);
          this.cargarVentasUltimos7Dias();
        }
      });

    this.estadoCorteCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.aplicarFiltroEstadoCorte());

    this.cargarMetodosPagoYVentas();
  }

  obtenerDiasPorPeriodo(periodo: string): number {
    switch (periodo) {
      case 'semanal':
        return 7;
      case 'quincenal':
        return 15;
      case 'mensual': {
        const hoy = new Date();
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        return ultimoDia.getDate();
      }
      default:
        return 7;
    }
  }

  private cargarMetodosPagoYVentas(): void {
    this.metodoPagoService
      .obtenerMetodosPago()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((metodos) => {
          this.metodosPago = metodos ?? [];
          return this.obtenerVentasUltimos7Dias();
        })
      )
      .subscribe({
        next: (cortes) => {
          this.aplicarRespuestaSearch(cortes);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando métodos de pago o ventas', err);
          this.error = 'Error al cargar los datos.';
          this.loading = false;
        }
      });
  }

  private construirFechaHoraISO(fecha: Date, hora: string): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${hora}`;
  }

  private obtenerVentasUltimos7Dias(): Observable<CorteVentaSearchItemDto[]> {
    const hoy = new Date();
    let fechaInicio: Date;
    let fechaFin: Date;

    const periodo = this.periodoCtrl.value;

    if (periodo === 'mensual') {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      fechaFin.setHours(23, 59, 59, 999);
    } else if (periodo === 'quincenal') {
      const diaActual = hoy.getDate();
      const mesActual = hoy.getMonth();
      const anioActual = hoy.getFullYear();

      if (diaActual <= 15) {
        fechaInicio = new Date(anioActual, mesActual, 1);
        fechaFin = new Date(anioActual, mesActual, 15);
      } else {
        fechaInicio = new Date(anioActual, mesActual, 16);
        fechaFin = new Date(anioActual, mesActual + 1, 0);
      }
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);
    } else {
      fechaFin = new Date(hoy);
      fechaFin.setHours(23, 59, 59, 999);
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - (this.diasVisibles - 1));
      fechaInicio.setHours(0, 0, 0, 0);
    }

    this.fechaInicioActual = fechaInicio;
    this.fechaFinActual = fechaFin;
    this.loading = true;
    this.error = null;

    return this.corteVentaService.search(
      this.construirFechaHoraISO(fechaInicio, '00:00:00'),
      this.construirFechaHoraISO(fechaFin, '23:59:59')
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.isResizing) {
      this.stopResize();
    }
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  }

  private actualizarNombresYColoresMetodosPago(): void {
    this.ventasPorFecha.forEach((ventaPorFecha) => {
      ventaPorFecha.detalles.forEach((detalle) => {
        const metodoPago = this.metodosPago.find(
          (m) => m.id === detalle.metodoPagoId
        );
        if (metodoPago) {
          detalle.metodoPagoNombre = metodoPago.descripcion;
        }
      });
    });
    this.ventasPorFechaVisibles.forEach((ventaPorFecha) => {
      ventaPorFecha.detalles.forEach((detalle) => {
        const metodoPago = this.metodosPago.find(
          (m) => m.id === detalle.metodoPagoId
        );
        if (metodoPago) {
          detalle.metodoPagoNombre = metodoPago.descripcion;
        }
      });
    });
  }

  cargarVentasUltimos7Dias(): void {
    this.loading = true;
    this.error = null;

    const periodo = this.periodoCtrl.value;
    if (periodo) {
      this.diasVisibles = this.obtenerDiasPorPeriodo(periodo);
    }

    this.obtenerVentasUltimos7Dias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cortes) => {
          this.aplicarRespuestaSearch(cortes);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando ventas', err);
          this.error = 'Error al cargar las ventas.';
          this.loading = false;
        }
      });
  }

  abrirModalCierreVentas(): void {
    this.dialog
      .open(CierreVentasComponent, {
        width: '1140px',
        disableClose: false,
        maxWidth: '95vw'
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result?.success) {
          return;
        }
        this.refrescarDatosIngresosMismoRango();
        if (result.requiereLogout) {
          this.cerrarSesionTrasCorteSinPermiso();
          return;
        }
        if (result.abrirDistribucion) {
          this.abrirDistribucionEfectivo();
        }
      });
  }

  private abrirDistribucionEfectivo(): void {
    this.corteVentaService
      .obtenerDistribucionPendiente()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ pendiente: false }))
      )
      .subscribe((pendiente) => {
        if (!pendiente?.pendiente) {
          return;
        }
        this.dialog
          .open(DistribucionEfectivoDialogComponent, {
            width: '520px',
            disableClose: true,
            data: { pendiente }
          })
          .afterClosed()
          .subscribe((res: DistribucionEfectivoDialogResult | undefined) => {
            if (res?.confirmada) {
              this.snackBar.open(
                'Se cerrará la sesión para iniciar el próximo turno.',
                'Cerrar',
                { duration: 4000 }
              );
              this.cerrarSesionCompleta();
              return;
            }
            if (res?.definirLuego) {
              this.cerrarSesionCompleta();
            }
          });
      });
  }

  private cerrarSesionTrasCorteSinPermiso(): void {
    this.snackBar.open(
      'Cierre registrado. Un administrador debe completar la Distribución de efectivo. Se cerrará la sesión.',
      'Cerrar',
      { duration: 6000 }
    );
    this.cerrarSesionCompleta();
  }

  private cerrarSesionCompleta(): void {
    const sessionId = localStorage.getItem('session-id');
    const idNum = sessionId ? Number(sessionId) : NaN;
    const fin$ = Number.isFinite(idNum)
      ? this.sesionesService.deleteSesion(idNum).pipe(catchError(() => of(null)))
      : of(null);
    fin$.subscribe(() => {
      localStorage.removeItem('session-id');
      this.authService.logout();
      void this.router.navigateByUrl('/login');
    });
  }

  /**
   * Vuelve a ejecutar `search` con el rango de fechas actualmente mostrado
   * (Dashboard o Datos) sin resetear la ventana al período por defecto.
   */
  private refrescarDatosIngresosMismoRango(): void {
    if (this.fechaInicioActual && this.fechaFinActual) {
      this.cargarVentasPorRango(this.fechaInicioActual, this.fechaFinActual);
    } else {
      this.cargarVentasUltimos7Dias();
    }
  }

  private cargarVentasPorRango(fechaInicio: Date, fechaFin: Date): void {
    this.loading = true;
    this.error = null;

    this.corteVentaService
      .search(
        this.construirFechaHoraISO(fechaInicio, '00:00:00'),
        this.construirFechaHoraISO(fechaFin, '23:59:59')
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cortes) => {
          this.aplicarRespuestaSearch(cortes);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando ventas por rango', err);
          this.error = 'Error al cargar las ventas.';
          this.loading = false;
        }
      });
  }

  aplicarFiltro(): void {
    const fechaInicio = this.fechaInicioCtrl.value;
    const fechaFin = this.fechaFinCtrl.value;

    if (!fechaInicio || !fechaFin) {
      return;
    }

    this.fechaInicioActual = fechaInicio;
    this.fechaFinActual = fechaFin;
    this.loading = true;
    this.error = null;

    this.corteVentaService
      .search(
        this.construirFechaHoraISO(fechaInicio, '00:00:00'),
        this.construirFechaHoraISO(fechaFin, '23:59:59')
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cortes) => {
          this.aplicarRespuestaSearch(cortes);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando ventas por rango', err);
          this.error = 'Error al cargar las ventas.';
          this.loading = false;
        }
      });
  }

  /**
   * Guarda la respuesta cruda para el modo listado (orden descendente por fechaIni)
   * y construye el agregado solo para el dashboard.
   */
  private aplicarRespuestaSearch(cortes: CorteVentaSearchItemDto[]): void {
    const lista = cortes ?? [];
    this.todosCortesVenta = [...lista].sort((a, b) =>
      b.fechaIni.localeCompare(a.fechaIni)
    );
    this.aplicarFiltroEstadoCorte();
    this.procesarRespuestaDashboardDesdeCortes(
      lista.filter((c) => c.estado !== 'eliminado')
    );
  }

  private aplicarFiltroEstadoCorte(): void {
    const filtro = this.estadoCorteCtrl.value ?? 'vigentes';
    this.cortesVentaListado = this.todosCortesVenta.filter((c) => {
      if (filtro === 'todos') return true;
      if (filtro === 'vigentes') return c.estado !== 'eliminado';
      return c.estado === filtro;
    });
    this.reconstruirCortesPorDia();
  }

  private reconstruirCortesPorDia(): void {
    const grupos = new Map<string, CorteVentaSearchItemDto[]>();
    for (const c of this.cortesVentaListado) {
      const key = CorteVentaService.fechaCalendarioDesdeIso(c.fechaIni);
      if (!key) {
        continue;
      }
      const arr = grupos.get(key);
      if (arr) {
        arr.push(c);
      } else {
        grupos.set(key, [c]);
      }
    }

    const keys = Array.from(grupos.keys()).sort((a, b) => b.localeCompare(a));
    this.cortesPorDia = keys.map((fechaKey) => {
      const cortes = (grupos.get(fechaKey) ?? []).slice().sort((a, b) =>
        b.fechaIni.localeCompare(a.fechaIni)
      );
      const agregado = this.corteVentaService.agruparPorFechaCalendario(cortes)[0];
      const detalles = (agregado?.ventasTipo || [])
        .map((vt) => {
          const monto = CorteVentaService.montoVentasDeTipo(vt);
          if (monto === 0) {
            return null;
          }
          const metodoPago = this.metodosPago.find((m) => m.id === vt.metodoPagoId);
          return {
            metodoPagoId: vt.metodoPagoId,
            metodoPagoNombre:
              metodoPago?.descripcion || `Método ${vt.metodoPagoId}`,
            total: monto
          };
        })
        .filter((d): d is NonNullable<typeof d> => d != null);
      const totalVentas = detalles.reduce((s, d) => s + d.total, 0);
      return {
        fechaKey,
        fechaLabel: this.formatearFechaParaLabel(agregado?.fechaIni ?? cortes[0].fechaIni),
        totalVentas,
        detalles,
        cortes
      };
    });
  }

  private procesarRespuestaDashboardDesdeCortes(cortes: CorteVentaSearchItemDto[]): void {
    const agrupados =
      this.corteVentaService.agruparPorFechaCalendario(cortes || []);

    this.ventasPorFecha = agrupados.map((item) => {
      const fechaKey = CorteVentaService.fechaCalendarioDesdeIso(item.fechaIni);
      const fechaLabel = this.formatearFechaParaLabel(item.fechaIni);
      const detalles = (item.ventasTipo || [])
        .map((vt) => {
          const monto = CorteVentaService.montoVentasDeTipo(vt);
          if (monto === 0) {
            return null;
          }
          const metodoPago = this.metodosPago.find(
            (m) => m.id === vt.metodoPagoId
          );
          return {
            metodoPagoId: vt.metodoPagoId,
            metodoPagoNombre:
              metodoPago?.descripcion || `Método ${vt.metodoPagoId}`,
            total: monto
          };
        })
        .filter((d): d is NonNullable<typeof d> => d != null);

      const totalDia = detalles.reduce((s, d) => s + d.total, 0);
      const delDia = (cortes || []).filter(
        (c) =>
          CorteVentaService.fechaCalendarioDesdeIso(c.fechaIni) === fechaKey
      );
      const cantidadCortes = delDia.length;
      const corteIds = delDia
        .map((c) => c.id)
        .filter((id) => Number.isFinite(id))
        .sort((a, b) => a - b);

      return {
        fecha: fechaLabel,
        fechaKey,
        total: totalDia,
        cantidadCortes,
        corteIds,
        detalles
      };
    });

    // Detalles por Fecha: más reciente primero
    this.ventasPorFecha.sort((a, b) =>
      (b.fechaKey || '').localeCompare(a.fechaKey || '')
    );

    this.totalGeneral = this.ventasPorFecha.reduce(
      (sum, v) => sum + (Number(v.total) || 0),
      0
    );
    this.ventasDiaActual = this.totalGeneral;

    const numItems = this.ventasPorFecha.length;
    this.promedioVentas = numItems > 0 ? this.totalGeneral / numItems : 0;

    this.ventasPorFechaVisibles = this.ventasPorFecha;

    if (this.metodosPago.length > 0) {
      this.actualizarNombresYColoresMetodosPago();
    }

    this.prepararDatosGrafico();
  }

  nombreUsuarioDesdeCache(usuarioId: string): string {
    const u = this.authService
      .obtenerTodosUsuariosCache()
      .find((x) => x.id === usuarioId);
    return u?.nombre ?? usuarioId;
  }

  metodoPagoDescripcion(metodoPagoId: number): string {
    const m = this.metodosPago.find((x) => x.id === metodoPagoId);
    return m?.descripcion ?? `Método ${metodoPagoId}`;
  }

  /** Ventas del sistema (tickets) por medio — fuente del dashboard Ingresos. */
  ventasTipoDeCorte(corte: CorteVentaSearchItemDto): {
    metodoPagoId: number;
    label: string;
    total: number;
  }[] {
    return (corte.ventasTipo || [])
      .map((vt) => {
        const total = CorteVentaService.montoVentasDeTipo(vt);
        if (total === 0) {
          return null;
        }
        return {
          metodoPagoId: vt.metodoPagoId,
          label: this.metodoPagoDescripcion(vt.metodoPagoId),
          total
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }

  /** Suma de ventas sistema del corte (KPI de ingresos). */
  totalVentasDeCorte(corte: CorteVentaSearchItemDto): number {
    return this.ventasTipoDeCorte(corte).reduce((s, v) => s + v.total, 0);
  }

  formatearFechaHora(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  eliminarCorteVenta(corte: CorteVentaSearchItemDto, event?: Event): void {
    event?.stopPropagation();
    if (
      !confirm(
        `¿Eliminar el corte #${corte.id}? Se conservará en el histórico y se revertirán sus ajustes.`
      )
    ) {
      return;
    }
    this.eliminandoCorteId = corte.id;
    this.corteVentaService
      .eliminar(corte.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.eliminandoCorteId = null;
          this.snackBar.open('Corte eliminado', 'Cerrar', { duration: 3000 });
          this.refrescarDatosIngresosMismoRango();
        },
        error: (err) => {
          this.eliminandoCorteId = null;
          console.error('Error eliminando corte', err);
          this.snackBar.open(
            'No se pudo eliminar el corte. Intente de nuevo.',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  abrirRevisionCorte(corte: CorteVentaSearchItemDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.esAdmin || corte.estado !== 'creada') {
      return;
    }
    this.dialog
      .open(CierreRevisionComponent, {
        data: { corteId: corte.id },
        width: '1220px',
        maxWidth: '96vw',
        disableClose: true
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((actualizado) => {
        if (actualizado) {
          this.refrescarDatosIngresosMismoRango();
        }
      });
  }

  verCortesDelDia(venta: VentasPorFecha, event?: Event): void {
    event?.stopPropagation();
    const ids = venta.corteIds ?? [];
    if (!ids.length) {
      return;
    }
    this.fechaSeleccionadaKey = venta.fechaKey;
    this.dialog
      .open(MovimientoReferenciaDialogComponent, {
        width: '920px',
        maxWidth: '96vw',
        data: {
          origenTipo: 'CORTE_VENTA',
          corteIds: ids,
          idReferencia: ids[0]
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.fechaSeleccionadaKey = null;
      });
  }

  private formatearFechaParaLabel(fechaIso: string): string {
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  navegarIzquierda(): void {
    if (!this.fechaInicioActual) return;

    const periodo = this.periodoCtrl.value;
    let nuevaFechaInicio: Date;
    let nuevaFechaFin: Date;

    if (periodo === 'mensual') {
      nuevaFechaFin = new Date(this.fechaInicioActual);
      nuevaFechaFin.setDate(0);
      nuevaFechaFin.setHours(23, 59, 59, 999);

      nuevaFechaInicio = new Date(
        nuevaFechaFin.getFullYear(),
        nuevaFechaFin.getMonth(),
        1
      );
      nuevaFechaInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'quincenal') {
      const diaInicio = this.fechaInicioActual.getDate();

      if (diaInicio === 1) {
        nuevaFechaFin = new Date(this.fechaInicioActual);
        nuevaFechaFin.setDate(0);
        nuevaFechaFin.setHours(23, 59, 59, 999);

        nuevaFechaInicio = new Date(
          nuevaFechaFin.getFullYear(),
          nuevaFechaFin.getMonth(),
          16
        );
        nuevaFechaInicio.setHours(0, 0, 0, 0);
      } else {
        nuevaFechaInicio = new Date(
          this.fechaInicioActual.getFullYear(),
          this.fechaInicioActual.getMonth(),
          1
        );
        nuevaFechaInicio.setHours(0, 0, 0, 0);

        nuevaFechaFin = new Date(
          this.fechaInicioActual.getFullYear(),
          this.fechaInicioActual.getMonth(),
          15
        );
        nuevaFechaFin.setHours(23, 59, 59, 999);
      }
    } else {
      nuevaFechaFin = new Date(this.fechaInicioActual);
      nuevaFechaFin.setDate(nuevaFechaFin.getDate() - 1);
      nuevaFechaFin.setHours(23, 59, 59, 999);

      nuevaFechaInicio = new Date(nuevaFechaFin);
      nuevaFechaInicio.setDate(
        nuevaFechaInicio.getDate() - (this.diasVisibles - 1)
      );
      nuevaFechaInicio.setHours(0, 0, 0, 0);
    }

    this.fechaInicioActual = nuevaFechaInicio;
    this.fechaFinActual = nuevaFechaFin;
    this.cargarVentasPorRango(nuevaFechaInicio, nuevaFechaFin);
  }

  navegarDerecha(): void {
    if (!this.fechaFinActual) return;

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    if (this.fechaFinActual >= hoy) {
      return;
    }

    const periodo = this.periodoCtrl.value;
    let nuevaFechaInicio: Date;
    let nuevaFechaFin: Date;

    if (periodo === 'mensual') {
      nuevaFechaInicio = new Date(this.fechaFinActual);
      nuevaFechaInicio.setMonth(nuevaFechaInicio.getMonth() + 1, 1);
      nuevaFechaInicio.setHours(0, 0, 0, 0);

      nuevaFechaFin = new Date(
        nuevaFechaInicio.getFullYear(),
        nuevaFechaInicio.getMonth() + 1,
        0
      );
      nuevaFechaFin.setHours(23, 59, 59, 999);

      if (nuevaFechaFin > hoy) {
        nuevaFechaFin = hoy;
      }
    } else if (periodo === 'quincenal') {
      const diaFin = this.fechaFinActual.getDate();
      const mesActual = this.fechaFinActual.getMonth();
      const anioActual = this.fechaFinActual.getFullYear();

      if (diaFin === 15) {
        nuevaFechaInicio = new Date(anioActual, mesActual, 16);
        nuevaFechaInicio.setHours(0, 0, 0, 0);

        nuevaFechaFin = new Date(anioActual, mesActual + 1, 0);
        nuevaFechaFin.setHours(23, 59, 59, 999);
      } else {
        nuevaFechaInicio = new Date(anioActual, mesActual + 1, 1);
        nuevaFechaInicio.setHours(0, 0, 0, 0);

        nuevaFechaFin = new Date(anioActual, mesActual + 1, 15);
        nuevaFechaFin.setHours(23, 59, 59, 999);
      }

      if (nuevaFechaFin > hoy) {
        nuevaFechaFin = hoy;
      }
    } else {
      nuevaFechaInicio = new Date(this.fechaFinActual);
      nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() + 1);
      nuevaFechaInicio.setHours(0, 0, 0, 0);

      nuevaFechaFin = new Date(nuevaFechaInicio);
      nuevaFechaFin.setDate(nuevaFechaFin.getDate() + (this.diasVisibles - 1));

      if (nuevaFechaFin > hoy) {
        nuevaFechaFin.setTime(hoy.getTime());
      }
      nuevaFechaFin.setHours(23, 59, 59, 999);
    }

    this.fechaInicioActual = nuevaFechaInicio;
    this.fechaFinActual = nuevaFechaFin;
    this.cargarVentasPorRango(nuevaFechaInicio, nuevaFechaFin);
  }

  puedeNavegarIzquierda(): boolean {
    return true;
  }

  puedeNavegarDerecha(): boolean {
    if (!this.fechaFinActual) return false;

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    return this.fechaFinActual < hoy;
  }

  toggleFiltros(): void {
    this.filtrosOcultos = !this.filtrosOcultos;

    if (this.filtrosOcultos) {
      this.leftPanelWidthAnterior = this.leftPanelWidth;
      this.leftPanelWidth = 0;
    } else {
      this.leftPanelWidth =
        this.leftPanelWidthAnterior > 0 ? this.leftPanelWidthAnterior : 220;
    }
  }

  private prepararDatosGrafico(): void {
    if (this.ventasPorFechaVisibles.length === 0) {
      this.chartSeries = [];
      return;
    }

    const fechasFormateadas = this.ventasPorFechaVisibles.map((v) => v.fecha);
    const seriesMap = new Map<
      number,
      { name: string; data: number[]; color: string }
    >();

    this.ventasPorFechaVisibles.forEach((ventaPorFecha) => {
      ventaPorFecha.detalles.forEach((detalle) => {
        if (!seriesMap.has(detalle.metodoPagoId)) {
          const metodoPago = this.metodosPago.find(
            (m) => m.id === detalle.metodoPagoId
          );
          const nombre =
            metodoPago?.descripcion ||
            detalle.metodoPagoNombre ||
            `Método ${detalle.metodoPagoId}`;
          const color = metodoPago?.color || '#000000';

          seriesMap.set(detalle.metodoPagoId, {
            name: nombre,
            data: new Array(fechasFormateadas.length).fill(0),
            color
          });
        }
      });
    });

    this.ventasPorFechaVisibles.forEach((ventaPorFecha, fechaIndex) => {
      ventaPorFecha.detalles.forEach((detalle) => {
        const serie = seriesMap.get(detalle.metodoPagoId);
        if (serie) {
          serie.data[fechaIndex] = Number(detalle.total) || 0;
        }
      });
    });

    const seriesArray = Array.from(seriesMap.entries())
      .sort(([idA], [idB]) => idA - idB)
      .map(([, serie]) => serie);

    const colores = seriesArray.map((s) => s.color);
    this.chartSeries = seriesArray.map(({ color, ...serie }) => serie);

    this.chartOptions = {
      ...this.chartOptions,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: fechasFormateadas
      },
      colors: colores,
      tooltip: {
        ...this.chartOptions.tooltip,
        x: {
          formatter: (val: number, opts?: any) => {
            const categoria = opts?.w?.globals?.categoryLabels?.[val];
            return categoria ?? (val != null ? String(val) : '');
          }
        }
      }
    };
    this.applyChartColorScheme(this.chartDarkMode);
  }

  /** Apex: ejes/leyenda legibles en dark y light. */
  private applyChartColorScheme(isDark: boolean): void {
    this.chartDarkMode = isDark;
    const fore = isDark ? 'rgba(255,255,255,0.78)' : '#373d3f';
    const grid = isDark ? 'rgba(255,255,255,0.12)' : '#e0e0e0';
    this.chartOptions = {
      ...this.chartOptions,
      theme: {
        mode: isDark ? 'dark' : 'light'
      },
      chart: {
        ...this.chartOptions.chart,
        background: 'transparent',
        foreColor: fore
      },
      grid: {
        ...this.chartOptions.grid,
        borderColor: grid
      },
      legend: {
        ...this.chartOptions.legend,
        labels: {
          colors: fore
        }
      },
      xaxis: {
        ...this.chartOptions.xaxis,
        labels: {
          ...this.chartOptions.xaxis?.labels,
          style: {
            ...(this.chartOptions.xaxis?.labels as { style?: object })?.style,
            colors: fore
          }
        }
      },
      yaxis: {
        ...this.chartOptions.yaxis,
        labels: {
          ...(this.chartOptions.yaxis as { labels?: object })?.labels,
          style: {
            colors: [fore]
          }
        }
      }
    };
  }

  formatCurrency(value: number): string {
    if (value == null || !Number.isFinite(value)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
      .format(value)
      .replace('COP', '$')
      .trim();
  }

  formatCurrencyEnMillones(value: number): string {
    const valorEnMiles = value / 1000;
    const valorRedondeado = Math.round(valorEnMiles);
    const valorFormateado = valorRedondeado
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `$${valorFormateado}`;
  }

  formatCurrencyCompletoConApostrofe(value: number): string {
    const valorRedondeado = Math.round(value);
    const valorStr = valorRedondeado.toString();
    const miles = valorStr.slice(-3);
    const millones = valorStr.slice(0, -3);

    if (millones.length === 0) {
      return `$${miles}`;
    }

    const millonesReversos = millones.split('').reverse();
    const gruposMillones: string[] = [];
    for (let i = 0; i < millonesReversos.length; i += 3) {
      gruposMillones.push(
        millonesReversos
          .slice(i, i + 3)
          .reverse()
          .join('')
      );
    }
    const millonesFormateados = gruposMillones.reverse().join("'");

    return `$${millonesFormateados}.${miles}`;
  }

  formatDateRange(fechaInicio: Date | null, fechaFin: Date | null): string {
    if (
      !fechaInicio ||
      !fechaFin ||
      !Number.isFinite(fechaInicio.getTime()) ||
      !Number.isFinite(fechaFin.getTime())
    ) {
      return '—';
    }
    const inicioStr = fechaInicio.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short'
    });
    const finStr = fechaFin.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year:
        fechaInicio.getFullYear() !== fechaFin.getFullYear()
          ? 'numeric'
          : undefined
    });
    return `${inicioStr} - ${finStr}`;
  }

  startResize(event: MouseEvent): void {
    if (this.filtrosOcultos) {
      return;
    }

    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.leftPanelWidth;

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
    event.preventDefault();
  }

  onResize = (event: MouseEvent): void => {
    if (!this.isResizing) return;

    const deltaX = event.clientX - this.resizeStartX;
    const newWidth = this.resizeStartWidth + deltaX;
    const minWidth = 200;
    const maxWidth = window.innerWidth * 0.6;

    this.leftPanelWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  };

  stopResize = (): void => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  };
}
