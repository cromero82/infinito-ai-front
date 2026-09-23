import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  LogInfluxRow,
  LogsErroresService
} from '../service/logs-errores.service';
import {
  formatLogMultilineText,
  logRowExtraJson,
  logRowLevel,
  logRowMessage,
  logRowTimeRaw
} from '../util/log-row-display.util';
import { downloadLogsAsXlsx } from '../util/export-logs-excel.util';
import {
  buildLogsPlainTextDocument,
  downloadPlainLogFile
} from '../util/export-logs-plain.util';
import { TableViewportService } from '../../../../core/table-viewport/table-viewport.service';
import { FechaUtilService } from '../../ventas/service/fecha-util.service';
import { FooterService } from '../../../../layouts/services/footer.service';

@Component({
  selector: 'gm-logs-aplicaciones-list',
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './logs-aplicaciones-list.component.html',
  styleUrl: './logs-aplicaciones-list.component.scss'
})
export class LogsAplicacionesListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['time', 'level', 'message', 'extra'];
  dataSource: LogInfluxRow[] = [];
  activeFilters: Array<{ label: string; value: string }> = [];
  selectedIndex: number | null = null;
  loading = false;
  filterFechaInicioCtrl = new FormControl<Date | null>(null);
  filterFechaFinCtrl = new FormControl<Date | null>(null);
  limitCtrl = new FormControl<number>(100, { nonNullable: true });
  limitOptions = [50, 100, 200, 500];
  tableScrollMaxHeight = 400;
  appliedFechaInicio: string | null = null;
  appliedFechaFin: string | null = null;
  exportingExcel = false;

  @ViewChild('filtersMenuTrigger') filtersMenuTrigger?: MatMenuTrigger;

  constructor(
    private readonly logsErroresService: LogsErroresService,
    private readonly tableViewportService: TableViewportService,
    private readonly fechaUtilService: FechaUtilService,
    private readonly footerService: FooterService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.footerService.clearFooterItems();
    this.applyViewport();
    this.fetchLogs();
  }

  ngOnDestroy(): void {
    this.footerService.clearFooterItems();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.applyViewport();
  }

  private applyViewport(): void {
    const v = this.tableViewportService.calculate({ reservedHeight: 388 });
    this.tableScrollMaxHeight = v.maxHeight;
  }

  fetchLogs(): void {
    this.loading = true;
    const limit = this.clampLimit(this.limitCtrl.value);
    this.logsErroresService
      .getFrontendLogs({
        from: this.appliedFechaInicio ?? undefined,
        to: this.appliedFechaFin ?? undefined,
        limit
      })
      .subscribe({
        next: (rows) => {
          this.dataSource = rows;
          this.loading = false;
          this.selectedIndex = null;
          this.updateFooter(rows.length);
        },
        error: () => {
          this.dataSource = [];
          this.loading = false;
          this.footerService.clearFooterItems();
        }
      });
  }

  private clampLimit(n: number): number {
    const v = Number.isFinite(n) ? Math.floor(n) : 100;
    return Math.min(500, Math.max(1, v));
  }

  restoreFiltersState(): void {
    this.filterFechaInicioCtrl.setValue(
      this.parseDateParam(this.appliedFechaInicio),
      { emitEvent: false }
    );
    this.filterFechaFinCtrl.setValue(
      this.parseDateParam(this.appliedFechaFin),
      { emitEvent: false }
    );
  }

  applyDateFilters(): void {
    const fechaInicio = this.formatDateParam(this.filterFechaInicioCtrl.value);
    const fechaFin = this.formatDateParam(this.filterFechaFinCtrl.value);
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      return;
    }
    this.appliedFechaInicio = fechaInicio;
    this.appliedFechaFin = fechaFin;
    this.syncActiveFilters();
    this.fetchLogs();
    setTimeout(() => this.filtersMenuTrigger?.closeMenu(), 100);
  }

  clearActiveFilter(triggerFetch = true): void {
    this.appliedFechaInicio = null;
    this.appliedFechaFin = null;
    this.filterFechaInicioCtrl.setValue(null, { emitEvent: false });
    this.filterFechaFinCtrl.setValue(null, { emitEvent: false });
    this.syncActiveFilters();
    if (triggerFetch) {
      this.fetchLogs();
    }
  }

  hasActiveDateFilter(): boolean {
    return !!this.appliedFechaInicio || !!this.appliedFechaFin;
  }

  limpiarFiltros(): void {
    this.limitCtrl.setValue(100, { emitEvent: false });
    this.clearActiveFilter(true);
  }

  selectRow(index: number): void {
    this.selectedIndex = index;
  }

  isRowSelected(index: number): boolean {
    return this.selectedIndex === index;
  }

  formatFechaHora(raw: string): string {
    if (!raw) return '—';
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        const local = this.fechaUtilService.parseDateAsLocal(raw);
        if (Number.isNaN(local.getTime())) return raw;
        return local.toLocaleString('es-CO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      return d.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return raw;
    }
  }

  cellTime(row: LogInfluxRow): string {
    return this.formatFechaHora(logRowTimeRaw(row));
  }

  cellLevel(row: LogInfluxRow): string {
    return logRowLevel(row);
  }

  cellMessage(row: LogInfluxRow): string {
    return logRowMessage(row);
  }

  cellExtraDisplay(row: LogInfluxRow): string {
    return formatLogMultilineText(logRowExtraJson(row));
  }

  async exportarExcel(): Promise<void> {
    if (this.dataSource.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }
    this.exportingExcel = true;
    try {
      const rows = this.dataSource.map((row) => ({
        fechaHora: this.cellTime(row),
        nivel: this.cellLevel(row),
        mensaje: formatLogMultilineText(this.cellMessage(row)),
        otrosCampos: this.cellExtraDisplay(row)
      }));
      await downloadLogsAsXlsx(rows, {
        filenameBase: 'logs-aplicaciones',
        sheetName: 'Logs aplicaciones'
      });
    } catch (err) {
      console.error(err);
      this.snackBar.open('No se pudo generar el archivo Excel', 'Cerrar', {
        duration: 4500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.exportingExcel = false;
    }
  }

  exportarLog(): void {
    if (this.dataSource.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }
    try {
      const rows = this.dataSource.map((row) => ({
        fechaHora: this.cellTime(row),
        nivel: this.cellLevel(row),
        mensaje: formatLogMultilineText(this.cellMessage(row)),
        otrosCampos: this.cellExtraDisplay(row)
      }));
      const doc = buildLogsPlainTextDocument('Logs aplicaciones', rows);
      downloadPlainLogFile(doc, 'logs-aplicaciones');
    } catch (err) {
      console.error(err);
      this.snackBar.open('No se pudo generar el archivo .log', 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    }
  }

  private syncActiveFilters(): void {
    const label = this.buildDateFilterLabel();
    this.activeFilters = label ? [label] : [];
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

  private formatDateParam(value: Date | null): string | null {
    if (!value) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateParam(value: string | null): Date | null {
    if (!value) return null;
    const parsed = this.fechaUtilService.parseDateAsLocal(value);
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

  private updateFooter(count: number): void {
    this.footerService.setFooterItems([
      {
        textoClave: 'Registros',
        valorClave: String(count),
        estiloCssClave: ''
      }
    ]);
  }
}
