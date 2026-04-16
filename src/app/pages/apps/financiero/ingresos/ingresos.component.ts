import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ApexOptions, VexChartComponent } from '@vex/components/vex-chart/vex-chart.component';
import { defaultChartOptions } from '@vex/utils/default-chart-options';
import { MetodoPagoService, MetodoPagoDto } from '../../ventas/service/metodo-pago.service';
import { CorteVentaService, CorteVentaSearchItemDto } from '../../ventas/service/corte-venta.service';
import { Subject, Observable } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { CierreVentasComponent } from './cierre-ventas/cierre-ventas.component';

interface VentasPorFecha {
  fecha: string;
  total: number;
  detalles: {
    metodoPagoId: number;
    metodoPagoNombre: string;
    total: number;
  }[];
}

@Component({
    selector: 'vex-ingresos',
    imports: [
        CommonModule,
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
        VexChartComponent
    ],
    templateUrl: './ingresos.component.html',
    styleUrls: ['./ingresos.component.scss']
})
export class IngresosComponent implements OnInit, OnDestroy {
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);
  periodoCtrl = new FormControl<string>('semanal');

  ventasPorFecha: VentasPorFecha[] = [];
  ventasPorFechaVisibles: VentasPorFecha[] = [];
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

  constructor(
    private corteVentaService: CorteVentaService,
    private metodoPagoService: MetodoPagoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const periodoInicial = this.periodoCtrl.value || 'semanal';
    this.diasVisibles = this.obtenerDiasPorPeriodo(periodoInicial);

    this.periodoCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(periodo => {
        if (periodo) {
          this.diasVisibles = this.obtenerDiasPorPeriodo(periodo);
          this.cargarVentasUltimos7Dias();
        }
      });

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
    this.metodoPagoService.obtenerMetodosPago()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((metodos) => {
          this.metodosPago = metodos ?? [];
          return this.obtenerVentasUltimos7Dias();
        })
      )
      .subscribe({
        next: (cortes) => {
          this.procesarRespuestaSearch(cortes);
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
    this.ventasPorFecha.forEach(ventaPorFecha => {
      ventaPorFecha.detalles.forEach(detalle => {
        const metodoPago = this.metodosPago.find(m => m.id === detalle.metodoPagoId);
        if (metodoPago) {
          detalle.metodoPagoNombre = metodoPago.descripcion;
        }
      });
    });
    this.ventasPorFechaVisibles.forEach(ventaPorFecha => {
      ventaPorFecha.detalles.forEach(detalle => {
        const metodoPago = this.metodosPago.find(m => m.id === detalle.metodoPagoId);
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
          this.procesarRespuestaSearch(cortes);
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
    this.dialog.open(CierreVentasComponent, {
      width: '950px',
      disableClose: false,
      maxWidth: '95vw'
    }).afterClosed().subscribe(result => {
      if (result?.success) {
        this.cargarVentasUltimos7Dias();
      }
    });
  }

  private cargarVentasPorRango(fechaInicio: Date, fechaFin: Date): void {
    this.loading = true;
    this.error = null;

    this.corteVentaService.search(
      this.construirFechaHoraISO(fechaInicio, '00:00:00'),
      this.construirFechaHoraISO(fechaFin, '23:59:59')
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cortes) => {
          this.procesarRespuestaSearch(cortes);
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

    this.corteVentaService.search(
      this.construirFechaHoraISO(fechaInicio, '00:00:00'),
      this.construirFechaHoraISO(fechaFin, '23:59:59')
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cortes) => {
          this.procesarRespuestaSearch(cortes);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando ventas por rango', err);
          this.error = 'Error al cargar las ventas.';
          this.loading = false;
        }
      });
  }

  private procesarRespuestaSearch(cortes: CorteVentaSearchItemDto[]): void {
    this.ventasPorFecha = (cortes || []).map(item => {
      const fechaLabel = this.formatearFechaParaLabel(item.fechaIni);
      const detalles = (item.ventasTipo || []).map(vt => {
        const metodoPago = this.metodosPago.find(m => m.id === vt.metodoPagoId);
        return {
          metodoPagoId: vt.metodoPagoId,
          metodoPagoNombre: metodoPago?.descripcion || `Método ${vt.metodoPagoId}`,
          total: Number(vt.total) || 0
        };
      });
      return {
        fecha: fechaLabel,
        total: Number(item.total) || 0,
        detalles
      };
    });

    this.totalGeneral = this.ventasPorFecha.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    this.ventasDiaActual = this.totalGeneral;

    const numItems = (cortes || []).length;
    this.promedioVentas = numItems > 0 ? this.totalGeneral / numItems : 0;

    this.ventasPorFechaVisibles = this.ventasPorFecha;

    if (this.metodosPago.length > 0) {
      this.actualizarNombresYColoresMetodosPago();
    }

    this.prepararDatosGrafico();
  }

  private formatearFechaParaLabel(fechaIso: string): string {
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
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

      nuevaFechaInicio = new Date(nuevaFechaFin.getFullYear(), nuevaFechaFin.getMonth(), 1);
      nuevaFechaInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'quincenal') {
      const diaInicio = this.fechaInicioActual.getDate();

      if (diaInicio === 1) {
        nuevaFechaFin = new Date(this.fechaInicioActual);
        nuevaFechaFin.setDate(0);
        nuevaFechaFin.setHours(23, 59, 59, 999);

        nuevaFechaInicio = new Date(nuevaFechaFin.getFullYear(), nuevaFechaFin.getMonth(), 16);
        nuevaFechaInicio.setHours(0, 0, 0, 0);
      } else {
        nuevaFechaInicio = new Date(this.fechaInicioActual.getFullYear(), this.fechaInicioActual.getMonth(), 1);
        nuevaFechaInicio.setHours(0, 0, 0, 0);

        nuevaFechaFin = new Date(this.fechaInicioActual.getFullYear(), this.fechaInicioActual.getMonth(), 15);
        nuevaFechaFin.setHours(23, 59, 59, 999);
      }
    } else {
      nuevaFechaFin = new Date(this.fechaInicioActual);
      nuevaFechaFin.setDate(nuevaFechaFin.getDate() - 1);
      nuevaFechaFin.setHours(23, 59, 59, 999);

      nuevaFechaInicio = new Date(nuevaFechaFin);
      nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() - (this.diasVisibles - 1));
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

      nuevaFechaFin = new Date(nuevaFechaInicio.getFullYear(), nuevaFechaInicio.getMonth() + 1, 0);
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
      this.leftPanelWidth = this.leftPanelWidthAnterior > 0 ? this.leftPanelWidthAnterior : 220;
    }
  }

  private prepararDatosGrafico(): void {
    if (this.ventasPorFechaVisibles.length === 0) {
      this.chartSeries = [];
      return;
    }

    const fechasFormateadas = this.ventasPorFechaVisibles.map(v => v.fecha);
    const seriesMap = new Map<number, { name: string; data: number[]; color: string }>();

    this.ventasPorFechaVisibles.forEach(ventaPorFecha => {
      ventaPorFecha.detalles.forEach(detalle => {
        if (!seriesMap.has(detalle.metodoPagoId)) {
          const metodoPago = this.metodosPago.find(m => m.id === detalle.metodoPagoId);
          const nombre = metodoPago?.descripcion || detalle.metodoPagoNombre || `Método ${detalle.metodoPagoId}`;
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
      ventaPorFecha.detalles.forEach(detalle => {
        const serie = seriesMap.get(detalle.metodoPagoId);
        if (serie) {
          serie.data[fechaIndex] = Number(detalle.total) || 0;
        }
      });
    });

    const seriesArray = Array.from(seriesMap.entries())
      .sort(([idA], [idB]) => idA - idB)
      .map(([, serie]) => serie);

    const colores = seriesArray.map(s => s.color);
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
    }).format(value).replace('COP', '$').trim();
  }

  formatCurrencyEnMillones(value: number): string {
    const valorEnMiles = value / 1000;
    const valorRedondeado = Math.round(valorEnMiles);
    const valorFormateado = valorRedondeado.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
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
      gruposMillones.push(millonesReversos.slice(i, i + 3).reverse().join(''));
    }
    const millonesFormateados = gruposMillones.reverse().join("'");

    return `$${millonesFormateados}.${miles}`;
  }

  formatDateRange(fechaInicio: Date | null, fechaFin: Date | null): string {
    if (!fechaInicio || !fechaFin || !Number.isFinite(fechaInicio.getTime()) || !Number.isFinite(fechaFin.getTime())) {
      return '—';
    }
    const inicioStr = fechaInicio.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short'
    });
    const finStr = fechaFin.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: fechaInicio.getFullYear() !== fechaFin.getFullYear() ? 'numeric' : undefined
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
