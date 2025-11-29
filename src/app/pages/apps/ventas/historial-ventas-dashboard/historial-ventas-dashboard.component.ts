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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  loading = false;
  error: string | null = null;
  
  metodosPago: MetodoPagoDto[] = [];
  totalGeneral = 0;
  
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
      type: 'line',
      height: 300,
      sparkline: {
        enabled: false
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      width: 4
    },
    xaxis: {
      type: 'category',
      labels: {
        show: true
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
    }
  });

  private destroy$ = new Subject<void>();

  constructor(
    private ventasTipoService: VentasTipoService,
    private metodoPagoService: MetodoPagoService
  ) {}

  ngOnInit(): void {
    this.cargarMetodosPago();
    this.cargarVentasDelDia();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarMetodosPago(): void {
    this.metodoPagoService.obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) => {
          this.metodosPago = metodos ?? [];
        },
        error: (err) => {
          console.error('Error cargando métodos de pago', err);
        }
      });
  }

  cargarVentasDelDia(): void {
    this.loading = true;
    this.error = null;
    this.fechaInicioCtrl.setValue(null);
    this.fechaFinCtrl.setValue(null);

    this.ventasTipoService.getVentasDelDia()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventas) => {
          this.procesarVentas(ventas);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando ventas del día', err);
          this.error = 'Error al cargar las ventas del día.';
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
      const metodoPago = this.metodosPago.find(m => m.id === venta.metodoPagoId);
      
      ventaPorFecha.detalles.push({
        metodoPagoId: venta.metodoPagoId,
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

    // Preparar datos para el gráfico
    this.prepararDatosGrafico();
  }

  private prepararDatosGrafico(): void {
    if (this.ventasPorFecha.length === 0) {
      this.chartSeries = [];
      return;
    }

    // Obtener todas las fechas
    const fechas = this.ventasPorFecha.map(v => v.fecha);

    // Crear una serie por cada método de pago con su color
    const seriesMap = new Map<number, { name: string; data: number[]; color: string }>();

    this.ventasPorFecha.forEach(ventaPorFecha => {
      ventaPorFecha.detalles.forEach(detalle => {
        if (!seriesMap.has(detalle.metodoPagoId)) {
          const metodoPago = this.metodosPago.find(m => m.id === detalle.metodoPagoId);
          seriesMap.set(detalle.metodoPagoId, {
            name: detalle.metodoPagoNombre,
            data: new Array(fechas.length).fill(0),
            color: metodoPago?.color || '#000000' // Color por defecto si no se encuentra
          });
        }
      });
    });

    // Llenar los datos
    this.ventasPorFecha.forEach((ventaPorFecha, fechaIndex) => {
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

    // Actualizar las opciones del gráfico con las fechas y colores
    this.chartOptions = {
      ...this.chartOptions,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: fechas
      },
      colors: colores
    };
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

  formatDate(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

