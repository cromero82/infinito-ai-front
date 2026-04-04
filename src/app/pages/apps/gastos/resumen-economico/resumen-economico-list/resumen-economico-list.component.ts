import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import {
  EstadisticaFinancieraService,
  EstadisticaFinancieraDiariaDto,
  EstadisticaFinancieraMensualDto,
  EstadisticaFinancieraAnualDto,
  EstadisticaFinancieraPutResponse
} from '../service/estadistica-financiera.service';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';
import { UtilidadEditComponent, UtilidadEditPeriodo } from '../utilidad-edit/utilidad-edit.component';
import { httpErrorMessage } from '../http-error.util';
import { FooterService } from '../../../../../layouts/services/footer.service';

export type VistaEstadistica = 'diaria' | 'mensual' | 'anual';

@Component({
  selector: 'gm-resumen-economico-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    NgIf,
    NgSwitch,
    NgSwitchCase
  ],
  templateUrl: './resumen-economico-list.component.html',
  styleUrl: './resumen-economico-list.component.scss'
})
export class ResumenEconomicoListComponent implements OnInit, AfterViewInit, OnDestroy {
  vista: VistaEstadistica = 'diaria';

  dataDiaria: EstadisticaFinancieraDiariaDto[] = [];
  dataMensual: EstadisticaFinancieraMensualDto[] = [];
  dataAnual: EstadisticaFinancieraAnualDto[] = [];

  loading = false;
  loadingMore = false;
  pageSize = 10;
  pageIndex = 0;
  hasMoreDiaria = false;

  displayedColumnsDiaria = [
    'periodo',
    'totalVentas',
    'totalEgresos',
    'utilidad',
    'porcentajeUtilidad',
    'semaforo',
    'tipoResultado',
    'fechaCreacion',
    'acciones'
  ];
  displayedColumnsMensual = [
    'periodo',
    'totalVentas',
    'totalEgresos',
    'utilidad',
    'porcentajeUtilidad',
    'semaforo',
    'tipoResultado',
    'fechaCreacion',
    'acciones'
  ];
  displayedColumnsAnual = [
    'periodo',
    'totalVentas',
    'totalEgresos',
    'utilidad',
    'porcentajeUtilidad',
    'semaforo',
    'tipoResultado',
    'fechaCreacion',
    'acciones'
  ];

  /** Id de fila en proceso de recálculo (PUT) */
  recalculandoId: number | null = null;

  @ViewChild('tableScrollDiaria') tableScrollDiaria!: ElementRef<HTMLElement>;

  private onScrollBound = () => this.onTableScrollDiaria();

  constructor(
    private estadisticaService: EstadisticaFinancieraService,
    private tableViewportService: TableViewportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private footerService: FooterService
  ) {}

  ngOnInit() {
    this.footerService.clearFooterItems();
    this.applyViewport();
    this.cargarVista();
  }

  ngAfterViewInit() {
    setTimeout(() => this.attachScrollDiaria(), 100);
  }

  ngOnDestroy() {
    this.detachScrollDiaria();
    this.footerService.clearFooterItems();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.applyViewport();
  }

  private applyViewport() {
    // Más espacio reservado (toolbar, tabs Gastos, footer global) para pageSize acorde al viewport
    const v = this.tableViewportService.calculate({ reservedHeight: 460 });
    this.pageSize = v.pageSize;
  }

  setVista(v: VistaEstadistica | string | null | undefined) {
    if (v !== 'diaria' && v !== 'mensual' && v !== 'anual') return;
    if (this.vista === v) return;
    this.footerService.clearFooterItems();
    this.vista = v;
    this.cargarVista();
  }

  cargarVista() {
    if (this.vista === 'diaria') {
      this.cargarDiaria(true);
    } else if (this.vista === 'mensual') {
      this.cargarMensual();
    } else {
      this.cargarAnual();
    }
  }

  private cargarDiaria(reset: boolean) {
    if (reset) {
      this.loading = true;
      this.pageIndex = 0;
      this.dataDiaria = [];
    }
    this.estadisticaService.getDiaria(reset ? 0 : this.pageIndex + 1, this.pageSize).subscribe({
      next: (page) => {
        if (reset) {
          this.dataDiaria = page.content;
        } else {
          this.dataDiaria = [...this.dataDiaria, ...page.content];
        }
        this.pageIndex = page.number;
        this.hasMoreDiaria = !page.last;
        this.loading = false;
        this.loadingMore = false;
        this.actualizarFooterVistaDiaria();
        setTimeout(() => {
          this.attachScrollDiaria();
          this.maybeLoadMoreDiaria();
        }, 50);
      },
      error: () => {
        this.dataDiaria = [];
        this.hasMoreDiaria = false;
        this.loading = false;
        this.loadingMore = false;
        this.footerService.clearFooterItems();
      }
    });
  }

  private cargarMensual() {
    this.loading = true;
    this.estadisticaService.getMensual().subscribe({
      next: (rows) => {
        this.dataMensual = rows;
        this.loading = false;
        this.actualizarFooterPorFilas('Meses', this.dataMensual);
      },
      error: () => {
        this.dataMensual = [];
        this.loading = false;
        this.footerService.clearFooterItems();
      }
    });
  }

  private cargarAnual() {
    this.loading = true;
    this.estadisticaService.getAnual().subscribe({
      next: (rows) => {
        this.dataAnual = rows;
        this.loading = false;
        this.actualizarFooterPorFilas('Años', this.dataAnual);
      },
      error: () => {
        this.dataAnual = [];
        this.loading = false;
        this.footerService.clearFooterItems();
      }
    });
  }

  private attachScrollDiaria() {
    this.detachScrollDiaria();
    const el = this.tableScrollDiaria?.nativeElement;
    if (el && this.vista === 'diaria') {
      el.addEventListener('scroll', this.onScrollBound);
    }
  }

  private detachScrollDiaria() {
    const el = this.tableScrollDiaria?.nativeElement;
    if (el) {
      el.removeEventListener('scroll', this.onScrollBound);
    }
  }

  private onTableScrollDiaria() {
    const el = this.tableScrollDiaria?.nativeElement;
    if (!el || this.loadingMore || !this.hasMoreDiaria || this.loading || this.vista !== 'diaria') return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      this.loadMoreDiaria();
    }
  }

  loadMoreDiaria() {
    if (this.loadingMore || !this.hasMoreDiaria) return;
    this.loadingMore = true;
    this.estadisticaService.getDiaria(this.pageIndex + 1, this.pageSize).subscribe({
      next: (page) => {
        this.dataDiaria = [...this.dataDiaria, ...page.content];
        this.pageIndex = page.number;
        this.hasMoreDiaria = !page.last;
        this.loadingMore = false;
        this.actualizarFooterVistaDiaria();
        setTimeout(() => this.maybeLoadMoreDiaria(), 50);
      },
      error: () => {
        this.loadingMore = false;
      }
    });
  }

  private maybeLoadMoreDiaria() {
    if (this.loading || this.loadingMore || !this.hasMoreDiaria) return;
    const el = this.tableScrollDiaria?.nativeElement;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 10) {
      this.loadMoreDiaria();
    }
  }

  abrirUtilidadEdit() {
    const periodoMap: Record<VistaEstadistica, UtilidadEditPeriodo> = {
      diaria: 'dia',
      mensual: 'mes',
      anual: 'anio'
    };
    this.dialog
      .open(UtilidadEditComponent, {
        width: '480px',
        data: { periodo: periodoMap[this.vista] }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.cargarVista();
      });
  }

  /** Color del API para columna Semáforo */
  colorSemaforo(row: { tipoResultadoFin: { color?: string } | null }): string {
    const c = row.tipoResultadoFin?.color?.trim();
    return c || '#9e9e9e';
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatPct(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(2)} %`;
  }

  formatFechaHora(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  periodoLabelDiaria(row: EstadisticaFinancieraDiariaDto): string {
    return row.valorTiempo || row.dia || '—';
  }

  periodoLabelMensual(row: EstadisticaFinancieraMensualDto): string {
    return row.valorTiempo || row.mes || '—';
  }

  periodoLabelAnual(row: EstadisticaFinancieraAnualDto): string {
    return row.valorTiempo || row.anio || '—';
  }

  /**
   * Sustituye la fila por el registro devuelto por el PUT sin recargar la lista.
   */
  private reemplazarFilaPorRespuestaPut(
    row: EstadisticaFinancieraDiariaDto | EstadisticaFinancieraMensualDto | EstadisticaFinancieraAnualDto,
    api: EstadisticaFinancieraPutResponse
  ): void {
    const id = row.id;
    if (this.vista === 'diaria') {
      const idx = this.dataDiaria.findIndex((x) => x.id === id);
      if (idx < 0) return;
      const prev = this.dataDiaria[idx];
      const merged: EstadisticaFinancieraDiariaDto = {
        ...prev,
        ...api,
        dia: api.dia ?? api.valorTiempo ?? prev.dia
      };
      this.dataDiaria = this.dataDiaria.map((x, i) => (i === idx ? merged : x));
      this.actualizarFooterVistaDiaria();
      return;
    }
    if (this.vista === 'mensual') {
      const idx = this.dataMensual.findIndex((x) => x.id === id);
      if (idx < 0) return;
      const prev = this.dataMensual[idx];
      const merged: EstadisticaFinancieraMensualDto = {
        ...prev,
        ...api,
        mes: api.mes ?? api.valorTiempo ?? prev.mes
      };
      this.dataMensual = this.dataMensual.map((x, i) => (i === idx ? merged : x));
      this.actualizarFooterPorFilas('Meses', this.dataMensual);
      return;
    }
    const idx = this.dataAnual.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const prev = this.dataAnual[idx];
    const merged: EstadisticaFinancieraAnualDto = {
      ...prev,
      ...api,
      anio: api.anio ?? api.valorTiempo ?? prev.anio
    };
    this.dataAnual = this.dataAnual.map((x, i) => (i === idx ? merged : x));
    this.actualizarFooterPorFilas('Años', this.dataAnual);
  }

  recalcular(row: EstadisticaFinancieraDiariaDto | EstadisticaFinancieraMensualDto | EstadisticaFinancieraAnualDto) {
    const valorTiempo = row.valorTiempo?.trim();
    if (!valorTiempo || this.recalculandoId !== null) return;
    this.recalculandoId = row.id;
    this.estadisticaService.putActualizar({ valorTiempo }).subscribe({
      next: (r: EstadisticaFinancieraPutResponse) => {
        this.snackBar.open('Período modificado correctamente', undefined, {
          duration: 5000,
          horizontalPosition: 'right',
          panelClass: ['recibo-snackbar-success']
        });
        this.reemplazarFilaPorRespuestaPut(row, r);
        this.recalculandoId = null;
      },
      error: (err: unknown) => {
        this.recalculandoId = null;
        const msg = httpErrorMessage(err, 'Error al recalcular');
        this.snackBar.open(msg, undefined, {
          duration: 7000,
          horizontalPosition: 'right',
          panelClass: ['recibo-snackbar-error']
        });
      }
    });
  }

  isRecalculando(row: { id: number }): boolean {
    return this.recalculandoId === row.id;
  }

  /**
   * Totales sobre las filas visibles (Diaria: paginación + recalcular; Mensual/Anual: lista completa + recalcular).
   * % utilidad = margen global: sum(utilidad) / sum(ventas) × 100 cuando hay ventas.
   */
  private actualizarFooterPorFilas(
    labelPeriodo: 'Días' | 'Meses' | 'Años',
    rows: Array<{
      totalVentas?: number | null;
      totalEgresos?: number | null;
      utilidad?: number | null;
    }>
  ): void {
    const n = rows.length;
    let sumVentas = 0;
    let sumEgresos = 0;
    let sumUtilidad = 0;
    for (const r of rows) {
      sumVentas += r.totalVentas ?? 0;
      sumEgresos += r.totalEgresos ?? 0;
      sumUtilidad += r.utilidad ?? 0;
    }
    const pctUtilidad = sumVentas !== 0 ? (sumUtilidad / sumVentas) * 100 : null;
    const pctStr =
      pctUtilidad === null || Number.isNaN(pctUtilidad) ? '—' : `${pctUtilidad.toFixed(2)} %`;

    this.footerService.setFooterItems([
      { textoClave: labelPeriodo, valorClave: String(n), estiloCssClave: '' },
      {
        textoClave: 'Total ventas',
        valorClave: this.formatCurrency(sumVentas),
        estiloCssClave: ''
      },
      {
        textoClave: 'Total egresos',
        valorClave: this.formatCurrency(sumEgresos),
        estiloCssClave: ''
      },
      {
        textoClave: 'Total utilidad',
        valorClave: this.formatCurrency(sumUtilidad),
        estiloCssClave: ''
      },
      {
        textoClave: '% utilidad',
        valorClave: pctStr,
        estiloCssClave: 'footer-item-total-highlight'
      }
    ]);
  }

  private actualizarFooterVistaDiaria(): void {
    if (this.vista !== 'diaria') return;
    this.actualizarFooterPorFilas('Días', this.dataDiaria);
  }
}
