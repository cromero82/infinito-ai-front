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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  UntypedFormControl,
  FormControl,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
  DateAdapter,
  NativeDateAdapter
} from '@angular/material/core';
import {
  EgresosService,
  EgresoDto,
  EgresoSearchParams
} from '../service/egresos.service';
import {
  TipoEgresoService,
  TipoEgresoDto
} from '../service/tipo-egreso.service';
import {
  ProveedorService,
  ProveedorDto
} from '../../proveedores/service/proveedor.service';
import { EgresoEditComponent } from '../egreso-edit/egreso-edit.component';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';
import { FooterService } from '../../../../../layouts/services/footer.service';

class DateAdapterDDMMYYYY extends NativeDateAdapter {
  override format(date: Date, displayFormat: object): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.includes('/')) {
      const [d, m, y] = value.split('/').map(Number);
      if (d && m && y) {
        return new Date(y, m - 1, d);
      }
    }
    return super.parse(value);
  }
}

@Component({
  selector: 'gm-egreso-list',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: DateAdapter, useClass: DateAdapterDDMMYYYY },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'dd/MM/yyyy' },
        display: {
          dateInput: 'dd/MM/yyyy',
          monthYearLabel: 'MMM yyyy',
          dateA11yLabel: 'dd/MM/yyyy',
          monthYearA11yLabel: 'MMMM yyyy'
        }
      }
    }
  ],
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
    FormsModule
  ],
  templateUrl: './egreso-list.component.html',
  styleUrl: './egreso-list.component.scss'
})
export class EgresoListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = [
    'fecha',
    'valor',
    'proveedor',
    'tipoEgreso',
    'descripcion',
    'edit'
  ];
  dataSource: EgresoDto[] = [];
  activeFilters: Array<{ label: string; value: string }> = [];
  selectedRowId: number | null = null;
  loading = false;
  loadingMore = false;
  descripcionCtrl = new UntypedFormControl('');
  tipoEgresoIdCtrl = new FormControl<number | ''>('');
  proveedorIdCtrl = new FormControl<number | ''>('');
  filterFechaInicioCtrl = new FormControl<Date | null>(null);
  filterFechaFinCtrl = new FormControl<Date | null>(null);
  tiposEgreso: TipoEgresoDto[] = [];
  proveedores: ProveedorDto[] = [];

  pageSize = 10;
  pageIndex = 0;
  totalElements = 0;
  hasMore = false;
  tableScrollMaxHeight = 400;
  appliedFechaInicio: string | null = null;
  appliedFechaFin: string | null = null;

  private justClosedDialog = false;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tableScroll') tableScroll!: ElementRef<HTMLElement>;
  @ViewChild('filtersMenuTrigger') filtersMenuTrigger?: MatMenuTrigger;

  constructor(
    private egresosService: EgresosService,
    private tipoEgresoService: TipoEgresoService,
    private proveedorService: ProveedorService,
    private dialog: MatDialog,
    private tableViewportService: TableViewportService,
    private fechaUtilService: FechaUtilService,
    private footerService: FooterService
  ) {}

  ngOnInit() {
    this.footerService.clearFooterItems();
    this.applyViewport();
    this.loadTiposYProveedores();
    this.searchEgresos();

    this.descripcionCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.justClosedDialog = false;
        this.searchEgresos();
      });

    this.tipoEgresoIdCtrl.valueChanges.subscribe(() => this.searchEgresos());
    this.proveedorIdCtrl.valueChanges.subscribe(() => this.searchEgresos());
  }

  private loadTiposYProveedores() {
    this.tipoEgresoService
      .getTiposEgreso()
      .subscribe((t) => (this.tiposEgreso = t));
    this.proveedorService
      .getProveedores()
      .subscribe((p) => (this.proveedores = p));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
      this.attachScrollListener();
    }, 100);
  }

  ngOnDestroy() {
    this.detachScrollListener();
    this.footerService.clearFooterItems();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.applyViewport();
  }

  private applyViewport() {
    const v = this.tableViewportService.calculate({ reservedHeight: 388 });
    this.pageSize = v.pageSize;
    this.tableScrollMaxHeight = v.maxHeight;
  }

  private attachScrollListener() {
    this.detachScrollListener();
    const el = this.tableScroll?.nativeElement;
    if (el) {
      el.addEventListener('scroll', this.onTableScrollBound);
    }
  }

  private detachScrollListener() {
    const el = this.tableScroll?.nativeElement;
    if (el) {
      el.removeEventListener('scroll', this.onTableScrollBound);
    }
  }

  private onTableScrollBound = () => this.onTableScroll();

  private onTableScroll() {
    const el = this.tableScroll?.nativeElement;
    if (!el || this.loadingMore || !this.hasMore || this.loading) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 100;
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      this.loadMoreEgresos();
    }
  }

  loadMoreEgresos() {
    if (this.loadingMore || !this.hasMore) return;
    this.loadingMore = true;
    const params = this.buildSearchParams(this.pageIndex + 1);

    this.egresosService.searchEgresos(params).subscribe({
      next: (page) => {
        this.dataSource = [...this.dataSource, ...page.content];
        this.pageIndex = page.number;
        this.totalElements = page.totalElements;
        this.hasMore = !page.last;
        this.loadingMore = false;
        this.actualizarFooter();
        setTimeout(() => this.maybeLoadMoreIfNoScroll(), 50);
      },
      error: () => {
        this.loadingMore = false;
      }
    });
  }

  private maybeLoadMoreIfNoScroll() {
    if (this.loading || this.loadingMore || !this.hasMore) return;
    const el = this.tableScroll?.nativeElement;
    if (!el) return;
    const { scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 10 && this.hasMore) {
      this.loadMoreEgresos();
    }
  }

  searchEgresos() {
    this.loading = true;
    this.pageIndex = 0;
    const params = this.buildSearchParams(0);

    this.egresosService.searchEgresos(params).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.pageIndex = page.number;
        this.totalElements = page.totalElements;
        this.hasMore = !page.last;
        this.loading = false;
        this.actualizarFooter();
        setTimeout(() => {
          this.attachScrollListener();
          this.maybeLoadMoreIfNoScroll();
        }, 50);
      },
      error: () => {
        this.dataSource = [];
        this.hasMore = false;
        this.loading = false;
        this.footerService.clearFooterItems();
      }
    });
  }

  limpiarFiltros() {
    this.descripcionCtrl.setValue('');
    this.tipoEgresoIdCtrl.setValue('');
    this.proveedorIdCtrl.setValue('');
    this.clearActiveFilter(false);
    this.searchEgresos();
  }

  createEgreso() {
    const dialogRef = this.dialog.open(EgresoEditComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result) {
        this.searchEgresos();
      }
      this.focusSearchInput();
    });
  }

  editEgreso(egreso: EgresoDto) {
    const dialogRef = this.dialog.open(EgresoEditComponent, {
      width: '600px',
      data: egreso
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result && result._edit) {
        this.searchEgresos();
      }
      this.focusSearchInput();
    });
  }

  selectRow(egreso: EgresoDto): void {
    this.selectedRowId = egreso.id;
  }

  isRowSelected(egreso: EgresoDto): boolean {
    return this.selectedRowId === egreso.id;
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
    this.searchEgresos();
    setTimeout(() => this.filtersMenuTrigger?.closeMenu(), 100);
  }

  clearActiveFilter(triggerSearch = true): void {
    this.appliedFechaInicio = null;
    this.appliedFechaFin = null;
    this.filterFechaInicioCtrl.setValue(null, { emitEvent: false });
    this.filterFechaFinCtrl.setValue(null, { emitEvent: false });
    this.syncActiveFilters();
    if (triggerSearch) {
      this.searchEgresos();
    }
  }

  hasActiveDateFilter(): boolean {
    return !!this.appliedFechaInicio || !!this.appliedFechaFin;
  }

  private focusSearchInput() {
    if (this.searchInput?.nativeElement) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
        if (this.descripcionCtrl.value) {
          this.searchInput.nativeElement.select();
        }
      }, 100);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    try {
      const d = this.fechaUtilService.parseDateAsLocal(fecha);
      if (isNaN(d.getTime())) return fecha;
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  private buildSearchParams(page: number): EgresoSearchParams {
    return {
      descripcion: this.descripcionCtrl.value?.trim() || undefined,
      tipoEgresoId:
        this.tipoEgresoIdCtrl.value !== ''
          ? Number(this.tipoEgresoIdCtrl.value)
          : undefined,
      proveedorId:
        this.proveedorIdCtrl.value !== ''
          ? Number(this.proveedorIdCtrl.value)
          : undefined,
      fechaInicio: this.appliedFechaInicio ?? undefined,
      fechaFin: this.appliedFechaFin ?? undefined,
      page,
      size: this.pageSize
    };
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

  private actualizarFooter(): void {
    const dias = new Set(
      this.dataSource
        .map((egreso) => egreso.fecha?.trim())
        .filter((fecha): fecha is string => !!fecha)
    ).size;

    const totalEgresos = this.dataSource.reduce(
      (sum, egreso) => sum + (egreso.valor ?? 0),
      0
    );

    this.footerService.setFooterItems([
      { textoClave: 'Días', valorClave: String(dias), estiloCssClave: '' },
      {
        textoClave: 'Total egresos',
        valorClave: this.formatCurrency(totalEgresos),
        estiloCssClave: ''
      }
    ]);
  }
}
