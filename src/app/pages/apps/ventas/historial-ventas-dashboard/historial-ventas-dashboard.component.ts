import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApexOptions, VexChartComponent } from '@vex/components/vex-chart/vex-chart.component';
import { defaultChartOptions } from '@vex/utils/default-chart-options';
import { VentasTipoService, VentasTipoDto } from '../service/ventas-tipo.service';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { HistorialReciboService } from '../service/historial-recibo.service';
import { Subject, forkJoin, Observable } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

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
  selector: 'vex-historial-ventas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    VexChartComponent
  ],
  templateUrl: './historial-ventas-dashboard.component.html',
  styleUrls: ['./historial-ventas-dashboard.component.scss']
})
export class HistorialVentasDashboardComponent implements OnInit, OnDestroy {
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);
  
  ventasPorFecha: VentasPorFecha[] = [];
  ventasPorFechaVisibles: VentasPorFecha[] = [];
  loading = false;
  error: string | null = null;
  
  metodosPago: MetodoPagoDto[] = [];
  totalGeneral = 0;
  promedioVentas = 0;
  ventasDiaActual = 0;
  cargandoVentasDiaActual = false;
  
  // Navegación por semanas (ventana deslizante)
  fechaInicioActual: Date | null = null;
  fechaFinActual: Date | null = null;
  diasVisibles = 7;

  // Split pane (paneles redimensionables)
  leftPanelWidth = 220; // Ancho inicial del panel izquierdo (mínimo para dar más espacio al gráfico)
  isResizing = false;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  
  // Chart data
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
              return this.formatCurrencyCompleto(numVal);
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
      position: 'top'
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: (value: number) => {
          return this.formatCurrency(value);
        }
      }
    }
  });

  private destroy$ = new Subject<void>();

  constructor(
    private ventasTipoService: VentasTipoService,
    private metodoPagoService: MetodoPagoService,
    private historialReciboService: HistorialReciboService
  ) {}

  ngOnInit(): void {
    // Cargar métodos de pago primero, luego las ventas
    this.cargarMetodosPagoYVentas();
  }

  private cargarMetodosPagoYVentas(): void {
    // Cargar métodos de pago primero
    this.metodoPagoService.obtenerMetodosPago()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((metodos) => {
          this.metodosPago = metodos ?? [];
          // Una vez cargados los métodos de pago, cargar las ventas
          return this.obtenerVentasUltimos7Dias();
        })
      )
      .subscribe({
        next: (ventas) => {
          this.procesarVentas(ventas);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando métodos de pago o ventas', err);
          this.error = 'Error al cargar los datos.';
          this.loading = false;
        }
      });
  }

  private obtenerVentasUltimos7Dias(): Observable<VentasTipoDto[]> {
    const hoy = new Date();
    const fechaFin = new Date(hoy);
    fechaFin.setHours(23, 59, 59, 999);
    
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(fechaInicio.getDate() - (this.diasVisibles - 1));
    fechaInicio.setHours(0, 0, 0, 0);

    this.fechaInicioActual = fechaInicio;
    this.fechaFinActual = fechaFin;

    const fechaInicioStr = this.formatearFecha(fechaInicio);
    const fechaFinStr = this.formatearFecha(fechaFin);

    this.loading = true;
    this.error = null;

    return this.ventasTipoService.getVentasPorRangoFechas(fechaInicioStr, fechaFinStr);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Limpiar event listeners de resize si están activos
    if (this.isResizing) {
      this.stopResize();
    }
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  }

  private cargarMetodosPago(): void {
    this.metodoPagoService.obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) => {
          this.metodosPago = metodos ?? [];
          // Si ya hay ventas procesadas, actualizar los nombres y colores de los métodos de pago
          if (this.ventasPorFecha.length > 0) {
            this.actualizarNombresYColoresMetodosPago();
            this.prepararDatosGrafico();
          }
        },
        error: (err) => {
          console.error('Error cargando métodos de pago', err);
        }
      });
  }

  private actualizarNombresYColoresMetodosPago(): void {
    // Actualizar los nombres de los métodos de pago en los detalles
    this.ventasPorFecha.forEach(ventaPorFecha => {
      ventaPorFecha.detalles.forEach(detalle => {
        const metodoPago = this.metodosPago.find(m => m.id === detalle.metodoPagoId);
        if (metodoPago) {
          detalle.metodoPagoNombre = metodoPago.descripcion;
        }
      });
    });
    // También actualizar las ventas visibles
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
    
    this.obtenerVentasUltimos7Dias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventas) => {
          this.procesarVentas(ventas);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando ventas', err);
          this.error = 'Error al cargar las ventas.';
          this.loading = false;
        }
      });
  }

  cargarVentasDelDia(): void {
    this.loading = true;
    this.error = null;
    this.fechaInicioCtrl.setValue(null);
    this.fechaFinCtrl.setValue(null);

    // Cargar últimos 7 días en lugar de solo el día actual
    this.cargarVentasUltimos7Dias();
  }

  private cargarVentasPorRango(fechaInicio: Date, fechaFin: Date): void {
    this.loading = true;
    this.error = null;

    const fechaInicioStr = this.formatearFecha(fechaInicio);
    const fechaFinStr = this.formatearFecha(fechaFin);

    this.ventasTipoService.getVentasPorRangoFechas(fechaInicioStr, fechaFinStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventas) => {
          this.procesarVentas(ventas);
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

    const fechaInicioStr = this.formatearFecha(fechaInicio);
    const fechaFinStr = this.formatearFecha(fechaFin);

    this.loading = true;
    this.error = null;

    this.ventasTipoService.getVentasPorRangoFechas(fechaInicioStr, fechaFinStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventas) => {
          this.procesarVentas(ventas);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando ventas por rango', err);
          this.error = 'Error al cargar las ventas.';
          this.loading = false;
        }
      });
  }

  private procesarVentas(ventas: VentasTipoDto[]): void {
    // Agrupar ventas por fecha
    const ventasPorFechaMap = new Map<string, VentasPorFecha>();

    ventas.forEach(venta => {
      const fecha = venta.fecha;
      
      if (!ventasPorFechaMap.has(fecha)) {
        ventasPorFechaMap.set(fecha, {
          fecha,
          total: 0,
          detalles: []
        });
      }

      const ventaPorFecha = ventasPorFechaMap.get(fecha)!;
      // Buscar el método de pago (puede que aún no esté cargado)
      const metodoPago = this.metodosPago.find(m => m.id === venta.metodoPagoId);
      
      ventaPorFecha.detalles.push({
        metodoPagoId: venta.metodoPagoId,
        // Usar el nombre del método de pago si está disponible, sino usar un placeholder temporal
        metodoPagoNombre: metodoPago?.descripcion || `Método ${venta.metodoPagoId}`,
        total: venta.total
      });

      ventaPorFecha.total += venta.total;
    });

    // Convertir a array y ordenar por fecha
    this.ventasPorFecha = Array.from(ventasPorFechaMap.values())
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Calcular total general
    this.totalGeneral = this.ventasPorFecha.reduce((sum, v) => sum + v.total, 0);

    // Calcular promedio de ventas del rango
    this.calcularPromedioVentas();

    // Asignar todas las ventas como visibles (ya vienen filtradas por el rango)
    this.ventasPorFechaVisibles = this.ventasPorFecha;

    // Actualizar nombres de métodos de pago si ya están cargados
    if (this.metodosPago.length > 0) {
      this.actualizarNombresYColoresMetodosPago();
    }

    // Preparar datos para el gráfico
    this.prepararDatosGrafico();

    // Cargar ventas del día actual
    this.cargarVentasDiaActual();
  }

  private calcularPromedioVentas(): void {
    if (this.ventasPorFecha.length === 0) {
      this.promedioVentas = 0;
      return;
    }
    // Calcular el promedio dividiendo el total general entre el número de días con ventas
    this.promedioVentas = this.totalGeneral / this.ventasPorFecha.length;
  }

  private cargarVentasDiaActual(): void {
    const hoy = new Date();
    const fechaHoy = this.formatearFecha(hoy);
    
    this.cargandoVentasDiaActual = true;
    
    this.historialReciboService.getTotalByDate(fechaHoy)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (total) => {
          this.ventasDiaActual = total || 0;
          this.cargandoVentasDiaActual = false;
        },
        error: (err) => {
          console.error('Error cargando ventas del día actual', err);
          this.ventasDiaActual = 0;
          this.cargandoVentasDiaActual = false;
        }
      });
  }

  navegarIzquierda(): void {
    if (!this.fechaInicioActual) return;

    // Calcular nuevas fechas: retroceder 7 días
    const nuevaFechaFin = new Date(this.fechaInicioActual);
    nuevaFechaFin.setDate(nuevaFechaFin.getDate() - 1); // Un día antes de la fecha inicio actual
    nuevaFechaFin.setHours(23, 59, 59, 999);

    const nuevaFechaInicio = new Date(nuevaFechaFin);
    nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() - (this.diasVisibles - 1));
    nuevaFechaInicio.setHours(0, 0, 0, 0);

    this.fechaInicioActual = nuevaFechaInicio;
    this.fechaFinActual = nuevaFechaFin;

    this.cargarVentasPorRango(nuevaFechaInicio, nuevaFechaFin);
  }

  navegarDerecha(): void {
    if (!this.fechaFinActual) return;

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    // Si ya estamos en el día actual, no podemos avanzar más
    if (this.fechaFinActual >= hoy) {
      return;
    }

    // Calcular nuevas fechas: avanzar 7 días
    const nuevaFechaInicio = new Date(this.fechaFinActual);
    nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() + 1); // Un día después de la fecha fin actual
    nuevaFechaInicio.setHours(0, 0, 0, 0);

    const nuevaFechaFin = new Date(nuevaFechaInicio);
    nuevaFechaFin.setDate(nuevaFechaFin.getDate() + (this.diasVisibles - 1));
    
    // No avanzar más allá del día actual
    if (nuevaFechaFin > hoy) {
      nuevaFechaFin.setTime(hoy.getTime());
    }
    nuevaFechaFin.setHours(23, 59, 59, 999);

    this.fechaInicioActual = nuevaFechaInicio;
    this.fechaFinActual = nuevaFechaFin;

    this.cargarVentasPorRango(nuevaFechaInicio, nuevaFechaFin);
  }

  puedeNavegarIzquierda(): boolean {
    // Siempre se puede navegar a la izquierda (hacia el pasado)
    return true;
  }

  puedeNavegarDerecha(): boolean {
    if (!this.fechaFinActual) return false;
    
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    // Solo se puede navegar a la derecha si no estamos en el día actual
    return this.fechaFinActual < hoy;
  }

  private prepararDatosGrafico(): void {
    if (this.ventasPorFechaVisibles.length === 0) {
      this.chartSeries = [];
      return;
    }

    // Obtener todas las fechas visibles y formatearlas (solo la fecha, sin el total)
    const fechas = this.ventasPorFechaVisibles.map(v => v.fecha);
    const fechasFormateadas = fechas.map(fecha => this.formatearFechaParaGrafico(fecha));

    // Crear una serie por cada método de pago con su color
    const seriesMap = new Map<number, { name: string; data: number[]; color: string }>();

    this.ventasPorFechaVisibles.forEach(ventaPorFecha => {
      ventaPorFecha.detalles.forEach(detalle => {
        if (!seriesMap.has(detalle.metodoPagoId)) {
          const metodoPago = this.metodosPago.find(m => m.id === detalle.metodoPagoId);
          // Usar el nombre del método de pago si está disponible, sino usar el del detalle
          const nombre = metodoPago?.descripcion || detalle.metodoPagoNombre || `Método ${detalle.metodoPagoId}`;
          // Usar el color del método de pago si está disponible
          const color = metodoPago?.color || '#000000';
          
          seriesMap.set(detalle.metodoPagoId, {
            name: nombre,
            data: new Array(fechas.length).fill(0),
            color: color
          });
        }
      });
    });

    // Llenar los datos
    this.ventasPorFechaVisibles.forEach((ventaPorFecha, fechaIndex) => {
      ventaPorFecha.detalles.forEach(detalle => {
        const serie = seriesMap.get(detalle.metodoPagoId);
        if (serie) {
          serie.data[fechaIndex] = detalle.total;
        }
      });
    });

    // Convertir a array para ApexCharts y extraer colores
    const seriesArray = Array.from(seriesMap.values());
    const colores = seriesArray.map(s => s.color);
    
    // Preparar series sin el campo color (ApexCharts no lo necesita en la serie)
    this.chartSeries = seriesArray.map(({ color, ...serie }) => serie);

    // Actualizar las opciones del gráfico con las fechas formateadas y colores
    this.chartOptions = {
      ...this.chartOptions,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: fechasFormateadas
      },
      colors: colores
    };
  }

  private formatearFechaParaGrafico(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00'); // Agregar hora para evitar problemas de zona horaria
    
    // Días de la semana en español (abreviados)
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Meses en español (abreviados)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const diaSemana = diasSemana[date.getDay()];
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = meses[date.getMonth()];
    
    return `${diaSemana} ${dia} ${mes}`;
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('COP', '$').trim();
  }

  formatCurrencyEnMiles(value: number): string {
    // Dividir por 1000 para mostrar en miles
    const valorEnMiles = Math.round(value / 1000);
    // Formatear con separador de miles
    return `$ ${valorEnMiles.toLocaleString('es-CO')}`;
  }

  formatCurrencyCompleto(value: number): string {
    // Formatear el valor completo con separadores de miles (ej: 1'923.000)
    return value.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  formatDate(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateRange(fechaInicio: Date, fechaFin: Date): string {
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

  // Métodos para redimensionar paneles
  startResize(event: MouseEvent): void {
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
    
    // Limitar el ancho mínimo y máximo
    const minWidth = 200; // Ancho mínimo reducido para maximizar espacio del gráfico
    const maxWidth = window.innerWidth * 0.6; // Máximo 60% del ancho de la ventana
    
    this.leftPanelWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  }

  stopResize = (): void => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  }
}

