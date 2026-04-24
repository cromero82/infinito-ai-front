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

import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  EstadisticaFinancieraService,
  EstadisticaFinancieraDiariaDto,
  EstadisticaFinancieraMensualDto,
  EstadisticaFinancieraAnualDto,
  EstadisticaFinancieraPutResponse,
  EstadisticaFechaFiltro,
  EstadisticaMesFiltro,
  EstadisticaAnioFiltro
} from '../service/estadistica-financiera.service';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';
import {
  UtilidadEditComponent,
  UtilidadEditPeriodo
} from '../utilidad-edit/utilidad-edit.component';
import { httpErrorMessage } from '../http-error.util';
import { FooterService } from '../../../../../layouts/services/footer.service';
import { MonthYearPickerComponent } from '../../../../../core/components/month-year-picker/month-year-picker.component';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';

export type VistaEstadistica = 'diaria' | 'mensual' | 'anual';

@Component({
  selector: 'gm-resumen-economico-list',
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MonthYearPickerComponent,
    ReactiveFormsModule
  ],
  templateUrl: './resumen-economico-list.component.html',
  styleUrl: './resumen-economico-list.component.scss'
})
export class ResumenEconomicoListComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  vista: VistaEstadistica = 'diaria';

  readonly filterFechaInicioCtrl = new FormControl<Date | null>(null);
  readonly filterFechaFinCtrl = new FormControl<Date | null>(null);
  readonly filterMesInicioCtrl = new FormControl<Date | null>(null);
  readonly filterMesFinCtrl = new FormControl<Date | null>(null);
  readonly filterAnioInicioCtrl = new FormControl<string>('');
  readonly filterAnioFinCtrl = new FormControl<string>('');

  dataDiaria: EstadisticaFinancieraDiariaDto[] = [];
  dataMensual: EstadisticaFinancieraMensualDto[] = [];
  dataAnual: EstadisticaFinancieraAnualDto[] = [];
  activeFilters: Array<{ label: string; value: string }> = [];

  loading = false;
  loadingMore = false;
  pageSize = 10;
  pageIndex = 0;
  hasMoreDiaria = false;
  appliedFechaInicio: string | null = null;
  appliedFechaFin: string | null = null;
  appliedMesInicio: string | null = null;
  appliedMesFin: string | null = null;
  appliedAnioInicio: string | null = null;
  appliedAnioFin: string | null = null;

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
  selectedRowId: number | null = null;
  selectedRowVista: VistaEstadistica | null = null;

  @ViewChild('tableScrollDiaria') tableScrollDiaria!: ElementRef<HTMLElement>;
  @ViewChild('filtersMenuTrigger') filtersMenuTrigger?: MatMenuTrigger;

  private onScrollBound = () => this.onTableScrollDiaria();

  constructor(
    private estadisticaService: EstadisticaFinancieraService,
    private tableViewportService: TableViewportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private footerService: FooterService,
    private fechaUtilService: FechaUtilService
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
    this.syncActiveFilters();
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
    this.estadisticaService
      .getDiaria(
        reset ? 0 : this.pageIndex + 1,
        this.pageSize,
        this.getFechaFiltro()
      )
      .subscribe({
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
    this.estadisticaService.getMensual(this.getMesFiltro()).subscribe({
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
    this.estadisticaService.getAnual(this.getAnioFiltro()).subscribe({
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
    if (
      !el ||
      this.loadingMore ||
      !this.hasMoreDiaria ||
      this.loading ||
      this.vista !== 'diaria'
    )
      return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      this.loadMoreDiaria();
    }
  }

  loadMoreDiaria() {
    if (this.loadingMore || !this.hasMoreDiaria) return;
    this.loadingMore = true;
    this.estadisticaService
      .getDiaria(this.pageIndex + 1, this.pageSize, this.getFechaFiltro())
      .subscribe({
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

  restoreFiltersState(): void {
    if (this.vista === 'diaria') {
      this.filterFechaInicioCtrl.setValue(
        this.parseDateParam(this.appliedFechaInicio),
        { emitEvent: false }
      );
      this.filterFechaFinCtrl.setValue(
        this.parseDateParam(this.appliedFechaFin),
        { emitEvent: false }
      );
      return;
    }

    if (this.vista === 'mensual') {
      this.filterMesInicioCtrl.setValue(
        this.parseMonthParam(this.appliedMesInicio),
        { emitEvent: false }
      );
      this.filterMesFinCtrl.setValue(this.parseMonthParam(this.appliedMesFin), {
        emitEvent: false
      });
      return;
    }

    this.filterAnioInicioCtrl.setValue(this.appliedAnioInicio ?? '', {
      emitEvent: false
    });
    this.filterAnioFinCtrl.setValue(this.appliedAnioFin ?? '', {
      emitEvent: false
    });
  }

  applyFilters(): void {
    if (this.vista === 'diaria') {
      this.applyDateFilters();
      return;
    }
    if (this.vista === 'mensual') {
      this.applyMonthFilters();
      return;
    }
    this.applyYearFilters();
  }

  private applyDateFilters(): void {
    const fechaInicio = this.formatDateParam(this.filterFechaInicioCtrl.value);
    const fechaFin = this.formatDateParam(this.filterFechaFinCtrl.value);

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      this.snackBar.open(
        'La fecha inicio no puede ser mayor que la fecha fin',
        undefined,
        {
          duration: 5000,
          horizontalPosition: 'right',
          panelClass: ['recibo-snackbar-error']
        }
      );
      return;
    }

    this.appliedFechaInicio = fechaInicio;
    this.appliedFechaFin = fechaFin;
    this.syncActiveFilters();
    this.cargarVista();
    setTimeout(() => this.filtersMenuTrigger?.closeMenu(), 100);
  }

  private applyMonthFilters(): void {
    const mesInicio = this.formatMonthParam(this.filterMesInicioCtrl.value);
    const mesFin = this.formatMonthParam(this.filterMesFinCtrl.value);

    if (mesInicio && mesFin && mesInicio > mesFin) {
      this.snackBar.open(
        'El mes inicio no puede ser mayor que el mes fin',
        undefined,
        {
          duration: 5000,
          horizontalPosition: 'right',
          panelClass: ['recibo-snackbar-error']
        }
      );
      return;
    }

    this.appliedMesInicio = mesInicio;
    this.appliedMesFin = mesFin;
    this.syncActiveFilters();
    this.cargarVista();
    setTimeout(() => this.filtersMenuTrigger?.closeMenu(), 100);
  }

  private applyYearFilters(): void {
    const anioInicio = this.normalizeYearParam(this.filterAnioInicioCtrl.value);
    const anioFin = this.normalizeYearParam(this.filterAnioFinCtrl.value);

    if (
      (this.filterAnioInicioCtrl.value?.trim() && !anioInicio) ||
      (this.filterAnioFinCtrl.value?.trim() && !anioFin)
    ) {
      this.snackBar.open('Ingrese años válidos en formato YYYY', undefined, {
        duration: 5000,
        horizontalPosition: 'right',
        panelClass: ['recibo-snackbar-error']
      });
      return;
    }

    if (anioInicio && anioFin && Number(anioInicio) > Number(anioFin)) {
      this.snackBar.open(
        'El año inicial no puede ser mayor que el año final',
        undefined,
        {
          duration: 5000,
          horizontalPosition: 'right',
          panelClass: ['recibo-snackbar-error']
        }
      );
      return;
    }

    this.appliedAnioInicio = anioInicio;
    this.appliedAnioFin = anioFin;
    this.syncActiveFilters();
    this.cargarVista();
    setTimeout(() => this.filtersMenuTrigger?.closeMenu(), 100);
  }

  clearActiveFilter(): void {
    if (this.vista === 'diaria') {
      this.appliedFechaInicio = null;
      this.appliedFechaFin = null;
      this.filterFechaInicioCtrl.setValue(null, { emitEvent: false });
      this.filterFechaFinCtrl.setValue(null, { emitEvent: false });
    } else if (this.vista === 'mensual') {
      this.appliedMesInicio = null;
      this.appliedMesFin = null;
      this.filterMesInicioCtrl.setValue(null, { emitEvent: false });
      this.filterMesFinCtrl.setValue(null, { emitEvent: false });
    } else {
      this.appliedAnioInicio = null;
      this.appliedAnioFin = null;
      this.filterAnioInicioCtrl.setValue('', { emitEvent: false });
      this.filterAnioFinCtrl.setValue('', { emitEvent: false });
    }

    this.syncActiveFilters();
    this.cargarVista();
  }

  hasActiveFilter(): boolean {
    if (this.vista === 'diaria') {
      return !!this.appliedFechaInicio || !!this.appliedFechaFin;
    }
    if (this.vista === 'mensual') {
      return !!this.appliedMesInicio || !!this.appliedMesFin;
    }
    return !!this.appliedAnioInicio || !!this.appliedAnioFin;
  }

  selectRow(row: { id: number }): void {
    this.selectedRowId = row.id;
    this.selectedRowVista = this.vista;
  }

  isRowSelected(row: { id: number }): boolean {
    return (
      this.selectedRowVista === this.vista && this.selectedRowId === row.id
    );
  }

  periodoTooltipDiaria(row: EstadisticaFinancieraDiariaDto): string {
    const raw = row.valorTiempo || row.dia;
    if (!raw) return '';
    const date = this.fechaUtilService.parseDateAsLocal(raw);
    if (Number.isNaN(date.getTime())) return '';
    const daysOfWeek = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado'
    ];
    return daysOfWeek[date.getDay()] ?? '';
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

  private getFechaFiltro(): EstadisticaFechaFiltro | undefined {
    if (!this.appliedFechaInicio && !this.appliedFechaFin) {
      return undefined;
    }
    return {
      fechaInicio: this.appliedFechaInicio,
      fechaFin: this.appliedFechaFin
    };
  }

  private getMesFiltro(): EstadisticaMesFiltro | undefined {
    if (!this.appliedMesInicio && !this.appliedMesFin) {
      return undefined;
    }
    return {
      mesInicio: this.appliedMesInicio,
      mesFin: this.appliedMesFin
    };
  }

  private getAnioFiltro(): EstadisticaAnioFiltro | undefined {
    if (!this.appliedAnioInicio && !this.appliedAnioFin) {
      return undefined;
    }
    return {
      anioInicio: this.appliedAnioInicio,
      anioFin: this.appliedAnioFin
    };
  }

  private syncActiveFilters(): void {
    const filter = this.buildActiveFilterLabel();
    this.activeFilters = filter ? [filter] : [];
  }

  private buildActiveFilterLabel(): { label: string; value: string } | null {
    if (this.vista === 'diaria') {
      return this.buildDateFilterLabel();
    }
    if (this.vista === 'mensual') {
      return this.buildMonthFilterLabel();
    }
    return this.buildYearFilterLabel();
  }

  private buildDateFilterLabel(): { label: string; value: string } | null {
    const fechaInicio = this.formatDateDisplay(this.appliedFechaInicio);
    const fechaFin = this.formatDateDisplay(this.appliedFechaFin);

    if (this.appliedFechaInicio && this.appliedFechaFin) {
      return { label: 'Fechas:', value: `${fechaInicio} a ${fechaFin}` };
    }
    if (this.appliedFechaInicio) {
      return { label: 'Desde:', value: fechaInicio ?? '' };
    }
    if (this.appliedFechaFin) {
      return { label: 'Hasta:', value: fechaFin ?? '' };
    }
    return null;
  }

  private buildMonthFilterLabel(): { label: string; value: string } | null {
    const mesInicio = this.formatMonthDisplay(this.appliedMesInicio);
    const mesFin = this.formatMonthDisplay(this.appliedMesFin);

    if (this.appliedMesInicio && this.appliedMesFin) {
      return { label: 'Meses:', value: `${mesInicio} a ${mesFin}` };
    }
    if (this.appliedMesInicio) {
      return { label: 'Desde mes:', value: mesInicio ?? '' };
    }
    if (this.appliedMesFin) {
      return { label: 'Hasta mes:', value: mesFin ?? '' };
    }
    return null;
  }

  private buildYearFilterLabel(): { label: string; value: string } | null {
    if (this.appliedAnioInicio && this.appliedAnioFin) {
      return {
        label: 'Años:',
        value: `${this.appliedAnioInicio} a ${this.appliedAnioFin}`
      };
    }
    if (this.appliedAnioInicio) {
      return { label: 'Desde año:', value: this.appliedAnioInicio };
    }
    if (this.appliedAnioFin) {
      return { label: 'Hasta año:', value: this.appliedAnioFin };
    }
    return null;
  }

  private formatDateParam(value: Date | null): string | null {
    if (!value) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateParam(value: string | null): Date | null {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDateDisplay(value: string | null): string | null {
    const parsed = this.parseDateParam(value);
    if (!parsed) return null;
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatMonthDisplay(value: string | null): string | null {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    return `${match[2]}-${match[1]}`;
  }

  private formatMonthParam(value: Date | null): string | null {
    if (!value || Number.isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private parseMonthParam(value: string | null): Date | null {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return new Date(year, month - 1, 1);
  }

  private normalizeYearParam(value: string | null): string | null {
    const normalized = value?.trim() ?? '';
    if (!normalized) return null;
    return /^\d{4}$/.test(normalized) ? normalized : null;
  }

  private formatPeriodoDiaConMesTexto(
    value: string | null | undefined
  ): string {
    const raw = value?.trim();
    if (!raw) return '—';

    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return raw;

    const year = match[1];
    const month = Number(match[2]);
    const day = match[3];
    if (month < 1 || month > 12) return raw;

    const monthName = this.getMonthShortName(month);
    return `${year}/${monthName}/${day}`;
  }

  private formatPeriodoMesConTexto(value: string | null | undefined): string {
    const raw = value?.trim();
    if (!raw) return '—';

    const match = raw.match(/^(\d{4})-(\d{2})$/);
    if (!match) return raw;

    const year = match[1];
    const month = Number(match[2]);
    if (month < 1 || month > 12) return raw;

    const monthName = this.getMonthShortName(month);
    return `${year}/${monthName}`;
  }

  private getMonthShortName(month: number): string {
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ];
    return monthNames[month - 1] ?? String(month).padStart(2, '0');
  }

  periodoLabelDiaria(row: EstadisticaFinancieraDiariaDto): string {
    return this.formatPeriodoDiaConMesTexto(row.valorTiempo || row.dia);
  }

  periodoLabelMensual(row: EstadisticaFinancieraMensualDto): string {
    return this.formatPeriodoMesConTexto(row.valorTiempo || row.mes);
  }

  periodoLabelAnual(row: EstadisticaFinancieraAnualDto): string {
    return row.valorTiempo || row.anio || '—';
  }

  /**
   * Sustituye la fila por el registro devuelto por el PUT sin recargar la lista.
   */
  private reemplazarFilaPorRespuestaPut(
    row:
      | EstadisticaFinancieraDiariaDto
      | EstadisticaFinancieraMensualDto
      | EstadisticaFinancieraAnualDto,
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
      this.dataMensual = this.dataMensual.map((x, i) =>
        i === idx ? merged : x
      );
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

  recalcular(
    row:
      | EstadisticaFinancieraDiariaDto
      | EstadisticaFinancieraMensualDto
      | EstadisticaFinancieraAnualDto
  ) {
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
   * Utilidad del footer = ventas − egresos por fila (null tratado como 0), sin depender de que el API rellene `utilidad`.
   * % utilidad: sumUtilidad / sum(ventas) × 100 si hay ventas; si no hay ventas pero sí egresos (solo pérdidas), sumUtilidad / sum(egresos) × 100.
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
      const v = r.totalVentas ?? 0;
      const e = r.totalEgresos ?? 0;
      sumVentas += v;
      sumEgresos += e;
      sumUtilidad += v - e;
    }
    const pctUtilidad =
      sumVentas !== 0
        ? (sumUtilidad / sumVentas) * 100
        : sumEgresos !== 0
          ? (sumUtilidad / sumEgresos) * 100
          : null;
    const pctStr =
      pctUtilidad === null || Number.isNaN(pctUtilidad)
        ? '—'
        : `${pctUtilidad.toFixed(2)} %`;

    this.footerService.setFooterItems([
      { textoClave: labelPeriodo, valorClave: String(n), estiloCssClave: '' },
      {
        textoClave: 'Total utilidad',
        valorClave: this.formatCurrency(sumUtilidad),
        estiloCssClave: 'footer-item-utilidad-highlight'
      },
      {
        textoClave: '% utilidad',
        valorClave: pctStr,
        estiloCssClave: 'footer-item-total-highlight'
      },
      {
        textoClave: 'Total ventas',
        valorClave: this.formatCurrency(sumVentas),
        estiloCssClave: ''
      },
      {
        textoClave: 'Total egresos',
        valorClave: this.formatCurrency(sumEgresos),
        estiloCssClave: ''
      }
    ]);
  }

  private actualizarFooterVistaDiaria(): void {
    if (this.vista !== 'diaria') return;
    this.actualizarFooterPorFilas('Días', this.dataDiaria);
  }
}
