import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { VentasTipoService, VentasTipoDto } from '../service/ventas-tipo.service';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { HistorialReciboService } from '../service/historial-recibo.service';
import { Subject, forkJoin, Observable } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { VentaTipoMetodoPagoComponent } from '../venta-tipo-metodo-pago/venta-tipo-metodo-pago.component';

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
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    VexChartComponent
  ],
  templateUrl: './historial-ventas-dashboard.component.html',
  styleUrls: ['./historial-ventas-dashboard.component.scss']
})
export class HistorialVentasDashboardComponent implements OnInit, OnDestroy {
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);
  periodoCtrl = new FormControl<string>('semanal'); // 'semanal', 'quincenal', 'mensual'
  
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
  filtrosOcultos = false;
  private leftPanelWidthAnterior = 220; // Guardar el ancho anterior para restaurarlo
  
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
              
              // Usar formato según el período
              const periodo = this.periodoCtrl.value;
              if (periodo === 'mensual') {
                // Mensual: dividir por 1000 y mostrar con apóstrofe (ej: $3'387)
                return this.formatCurrencyEnMillones(numVal);
              } else {
                // Semanal y quincenal: valor completo con apóstrofe para millones (ej: $2'450.000)
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
        horizontal: 16, // Espacio horizontal entre elementos de la leyenda
        vertical: 8     // Espacio vertical entre filas de la leyenda
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
          // Si es período mensual, mostrar el día de la semana
          const periodo = this.periodoCtrl.value;
          if (periodo === 'mensual') {
            // Buscar la fecha original en las ventas para obtener el día de la semana
            const fechaIndex = opts?.dataPointIndex ?? val;
            if (fechaIndex !== undefined && this.ventasPorFechaVisibles[fechaIndex]) {
              const fecha = this.ventasPorFechaVisibles[fechaIndex].fecha;
              const date = new Date(fecha + 'T00:00:00');
              const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
              const diaSemana = diasSemana[date.getDay()];
              return `${diaSemana}`;
            }
            // Si no se encuentra por índice, intentar obtener desde las categorías
            if (opts?.w?.globals?.categoryLabels && opts.w.globals.categoryLabels[val]) {
              const categoria = opts.w.globals.categoryLabels[val];
              if (categoria && categoria.includes('/')) {
                const [dia, mes] = categoria.split('/');
                const añoActual = new Date().getFullYear();
                const date = new Date(añoActual, parseInt(mes) - 1, parseInt(dia));
                const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const diaSemana = diasSemana[date.getDay()];
                return `${diaSemana}`;
              }
            }
          }
          // Para otros períodos, devolver el valor original (será la categoría como string)
          return opts?.w?.globals?.categoryLabels?.[val] ?? String(val);
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
    private ventasTipoService: VentasTipoService,
    private metodoPagoService: MetodoPagoService,
    private historialReciboService: HistorialReciboService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Inicializar días visibles según el período seleccionado
    const periodoInicial = this.periodoCtrl.value || 'semanal';
    this.diasVisibles = this.obtenerDiasPorPeriodo(periodoInicial);
    
    // Escuchar cambios en el período y actualizar días visibles automáticamente
    this.periodoCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(periodo => {
        if (periodo) {
          this.diasVisibles = this.obtenerDiasPorPeriodo(periodo);
          this.cargarVentasUltimos7Dias();
        }
      });
    
    // Cargar métodos de pago primero, luego las ventas
    this.cargarMetodosPagoYVentas();
  }

  obtenerDiasPorPeriodo(periodo: string): number {
    switch (periodo) {
      case 'semanal':
        return 7;
      case 'quincenal':
        return 15;
      case 'mensual':
        // Obtener los días del mes actual
        const hoy = new Date();
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        return ultimoDia.getDate();
      default:
        return 7;
    }
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
    let fechaInicio: Date;
    let fechaFin: Date;
    
    const periodo = this.periodoCtrl.value;
    
    if (periodo === 'mensual') {
      // Para mensual: desde el día 1 hasta el último día del mes
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fechaInicio.setHours(0, 0, 0, 0);
      
      fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      fechaFin.setHours(23, 59, 59, 999);
    } else if (periodo === 'quincenal') {
      // Para quincenal: dividir el mes en dos quincenas
      // Primera quincena: días 1-15
      // Segunda quincena: días 16-30/31
      const diaActual = hoy.getDate();
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
      
      if (diaActual <= 15) {
        // Primera quincena: 1-15
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
      } else {
        // Segunda quincena: 16-30/31
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      }
      
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);
    } else {
      // Para semanal: desde hoy hacia atrás 7 días
      fechaFin = new Date(hoy);
      fechaFin.setHours(23, 59, 59, 999);
      
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - (this.diasVisibles - 1));
      fechaInicio.setHours(0, 0, 0, 0);
    }

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
    
    // Actualizar diasVisibles desde el período seleccionado
    const periodo = this.periodoCtrl.value;
    if (periodo) {
      this.diasVisibles = this.obtenerDiasPorPeriodo(periodo);
    }
    
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

  abrirModalRegistrarVenta(): void {
    this.dialog.open(VentaTipoMetodoPagoComponent, {
      width: '700px',
      disableClose: false,
      maxWidth: '90vw'
    }).afterClosed().subscribe(result => {
      if (result?.success) {
        // Recargar las ventas después de registrar
        this.cargarVentasDelDia();
      }
    });
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

    const periodo = this.periodoCtrl.value;
    let nuevaFechaInicio: Date;
    let nuevaFechaFin: Date;

    if (periodo === 'mensual') {
      // Navegar al mes anterior completo
      nuevaFechaFin = new Date(this.fechaInicioActual);
      nuevaFechaFin.setDate(0); // Último día del mes anterior
      nuevaFechaFin.setHours(23, 59, 59, 999);
      
      nuevaFechaInicio = new Date(nuevaFechaFin.getFullYear(), nuevaFechaFin.getMonth(), 1);
      nuevaFechaInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'quincenal') {
      // Navegar a la quincena anterior
      const diaInicio = this.fechaInicioActual.getDate();
      
      if (diaInicio === 1) {
        // Estamos en la primera quincena, ir a la segunda quincena del mes anterior
        nuevaFechaFin = new Date(this.fechaInicioActual);
        nuevaFechaFin.setDate(0); // Último día del mes anterior
        nuevaFechaFin.setHours(23, 59, 59, 999);
        
        nuevaFechaInicio = new Date(nuevaFechaFin.getFullYear(), nuevaFechaFin.getMonth(), 16);
        nuevaFechaInicio.setHours(0, 0, 0, 0);
      } else {
        // Estamos en la segunda quincena, ir a la primera quincena del mismo mes
        nuevaFechaInicio = new Date(this.fechaInicioActual.getFullYear(), this.fechaInicioActual.getMonth(), 1);
        nuevaFechaInicio.setHours(0, 0, 0, 0);
        
        nuevaFechaFin = new Date(this.fechaInicioActual.getFullYear(), this.fechaInicioActual.getMonth(), 15);
        nuevaFechaFin.setHours(23, 59, 59, 999);
      }
    } else {
      // Calcular nuevas fechas: retroceder según días visibles
      nuevaFechaFin = new Date(this.fechaInicioActual);
      nuevaFechaFin.setDate(nuevaFechaFin.getDate() - 1); // Un día antes de la fecha inicio actual
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

    // Si ya estamos en el día actual, no podemos avanzar más
    if (this.fechaFinActual >= hoy) {
      return;
    }

    const periodo = this.periodoCtrl.value;
    let nuevaFechaInicio: Date;
    let nuevaFechaFin: Date;

    if (periodo === 'mensual') {
      // Navegar al mes siguiente completo
      nuevaFechaInicio = new Date(this.fechaFinActual);
      nuevaFechaInicio.setMonth(nuevaFechaInicio.getMonth() + 1, 1); // Primer día del mes siguiente
      nuevaFechaInicio.setHours(0, 0, 0, 0);
      
      nuevaFechaFin = new Date(nuevaFechaInicio.getFullYear(), nuevaFechaInicio.getMonth() + 1, 0);
      nuevaFechaFin.setHours(23, 59, 59, 999);
      
      // Si el mes siguiente excede el día actual, limitar al día actual
      if (nuevaFechaFin > hoy) {
        nuevaFechaFin = hoy;
      }
    } else if (periodo === 'quincenal') {
      // Navegar a la quincena siguiente
      const diaFin = this.fechaFinActual.getDate();
      const mesActual = this.fechaFinActual.getMonth();
      const añoActual = this.fechaFinActual.getFullYear();
      const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0).getDate();
      
      if (diaFin === 15) {
        // Estamos en la primera quincena, ir a la segunda quincena del mismo mes
        nuevaFechaInicio = new Date(añoActual, mesActual, 16);
        nuevaFechaInicio.setHours(0, 0, 0, 0);
        
        nuevaFechaFin = new Date(añoActual, mesActual + 1, 0);
        nuevaFechaFin.setHours(23, 59, 59, 999);
      } else {
        // Estamos en la segunda quincena, ir a la primera quincena del mes siguiente
        nuevaFechaInicio = new Date(añoActual, mesActual + 1, 1);
        nuevaFechaInicio.setHours(0, 0, 0, 0);
        
        nuevaFechaFin = new Date(añoActual, mesActual + 1, 15);
        nuevaFechaFin.setHours(23, 59, 59, 999);
      }
      
      // Si excede el día actual, limitar al día actual
      if (nuevaFechaFin > hoy) {
        nuevaFechaFin = hoy;
      }
    } else {
      // Calcular nuevas fechas: avanzar según días visibles
      nuevaFechaInicio = new Date(this.fechaFinActual);
      nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() + 1); // Un día después de la fecha fin actual
      nuevaFechaInicio.setHours(0, 0, 0, 0);

      nuevaFechaFin = new Date(nuevaFechaInicio);
      nuevaFechaFin.setDate(nuevaFechaFin.getDate() + (this.diasVisibles - 1));
      
      // No avanzar más allá del día actual
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

  toggleFiltros(): void {
    this.filtrosOcultos = !this.filtrosOcultos;
    
    if (this.filtrosOcultos) {
      // Guardar el ancho actual antes de ocultar
      this.leftPanelWidthAnterior = this.leftPanelWidth;
      // Ocultar el panel (ancho 0)
      this.leftPanelWidth = 0;
    } else {
      // Restaurar el ancho anterior
      this.leftPanelWidth = this.leftPanelWidthAnterior > 0 ? this.leftPanelWidthAnterior : 220;
    }
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

    // Convertir a array para ApexCharts, ordenar por ID y extraer colores
    const seriesArray = Array.from(seriesMap.entries())
      .sort(([idA], [idB]) => idA - idB) // Ordenar por ID ascendente (1, 2, 3, ...)
      .map(([id, serie]) => serie);
    
    // Extraer colores en el mismo orden que las series
    const colores = seriesArray.map(s => s.color);
    
    // Preparar series sin el campo color (ApexCharts no lo necesita en la serie)
    this.chartSeries = seriesArray.map(({ color, ...serie }) => serie);

    // Actualizar las opciones del gráfico con las fechas formateadas y colores
    const periodo = this.periodoCtrl.value;
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
            // Si es período mensual, mostrar el día de la semana
            if (periodo === 'mensual') {
              // Buscar la fecha original en las ventas para obtener el día de la semana
              const fechaIndex = opts?.dataPointIndex ?? val;
              if (fechaIndex !== undefined && this.ventasPorFechaVisibles[fechaIndex]) {
                const fecha = this.ventasPorFechaVisibles[fechaIndex].fecha;
                const date = new Date(fecha + 'T00:00:00');
                const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const diaSemana = diasSemana[date.getDay()];
                return `${diaSemana}`;
              }
              // Si no se encuentra por índice, intentar obtener desde las categorías
              if (opts?.w?.globals?.categoryLabels && opts.w.globals.categoryLabels[val]) {
                const categoria = opts.w.globals.categoryLabels[val];
                if (categoria && categoria.includes('/')) {
                  const [dia, mes] = categoria.split('/');
                  const añoActual = new Date().getFullYear();
                  const date = new Date(añoActual, parseInt(mes) - 1, parseInt(dia));
                  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                  const diaSemana = diasSemana[date.getDay()];
                  return `${diaSemana}`;
                }
              }
            }
            // Para otros períodos, devolver el valor original (será la categoría como string)
            return opts?.w?.globals?.categoryLabels?.[val] ?? String(val);
          }
        }
      }
    };
  }

  private formatearFechaParaGrafico(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00'); // Agregar hora para evitar problemas de zona horaria
    
    const periodo = this.periodoCtrl.value;
    
    // Si es mensual, usar formato dd/mm
    if (periodo === 'mensual') {
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes}`;
    }
    
    // Para semanal y quincenal: formato con día de la semana
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
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

  formatCurrencyEnMillones(value: number): string {
    // Dividir por 1,000 para obtener miles (omitir los últimos 3 ceros)
    // Ejemplo: 3.387.000 / 1,000 = 3.387
    const valorEnMiles = value / 1000;
    // Redondear a entero
    const valorRedondeado = Math.round(valorEnMiles);
    // Formatear con apóstrofe como separador de miles
    const valorFormateado = valorRedondeado.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `$${valorFormateado}`;
  }

  formatCurrencyCompletoConApostrofe(value: number): string {
    // Formatear el valor completo con apóstrofe para millones y punto para miles
    // Ejemplo: 2.450.000 → $2'450.000
    const valorRedondeado = Math.round(value);
    const valorStr = valorRedondeado.toString();
    
    // Separar en grupos de 3 dígitos desde la derecha
    // Últimos 3 dígitos son miles, el resto son millones
    const miles = valorStr.slice(-3);
    const millones = valorStr.slice(0, -3);
    
    if (millones.length === 0) {
      // Si no hay millones, solo mostrar miles
      return `$${miles}`;
    }
    
    // Formatear millones con apóstrofe cada 3 dígitos desde la derecha
    // Dividir en grupos de 3 desde la derecha
    const millonesReversos = millones.split('').reverse();
    const gruposMillones: string[] = [];
    for (let i = 0; i < millonesReversos.length; i += 3) {
      gruposMillones.push(millonesReversos.slice(i, i + 3).reverse().join(''));
    }
    const millonesFormateados = gruposMillones.reverse().join("'");
    
    return `$${millonesFormateados}.${miles}`;
  }

  formatDate(fecha: string): string {
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    // La fecha viene en formato "YYYY-MM-DD"
    const partes = fecha.split('-');
    if (partes.length !== 3) {
      // Si no está en el formato esperado, intentar con Date pero agregar hora local
      const date = new Date(fecha + 'T00:00:00');
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    const year = parseInt(partes[0], 10);
    const month = parseInt(partes[1], 10) - 1; // Los meses en JavaScript son 0-indexados
    const day = parseInt(partes[2], 10);
    
    // Crear la fecha en hora local para evitar problemas de zona horaria
    const date = new Date(year, month, day);
    
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
    // No permitir redimensionar si los filtros están ocultos
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

