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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
import { MatNativeDateModule } from '@angular/material/core';
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
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../../core/components/confirm-dialog/confirm-dialog.component';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';
import { FooterService } from '../../../../../layouts/services/footer.service';
import { Router } from '@angular/router';
import {
  EntradaInventarioService,
  EntradaInventarioEstadoResumenDto
} from '../../entrada-inventario/service/entrada-inventario.service';
import {
  MetodoPagoService,
  MetodoPagoDto
} from '../../../ventas/service/metodo-pago.service';
import {
  OrigenFondosService
} from '../../origenes-fondos/service/origen-fondos.service';
import { OrigenFondosArbolItemDto } from '../../origenes-fondos/util/origen-fondos-arbol.util';
import { etiquetaMetodoPagoEgresoPorId } from '../util/metodo-pago-egreso-label.util';
import { egresoPermiteEntradaInventario } from '../util/egreso-permite-entrada-inventario.util';

@Component({
  selector: 'gm-egreso-list',
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
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
    'origen',
    'proveedor',
    'tipoEgreso',
    'descripcion',
    'entradaInventario',
    'edit',
    'delete'
  ];
  dataSource: EgresoDto[] = [];
  metodosPago: MetodoPagoDto[] = [];
  origenesArbol: OrigenFondosArbolItemDto[] = [];
  activeFilters: Array<{ label: string; value: string }> = [];
  selectedRowId: number | null = null;
  eliminandoEgresoId: number | null = null;
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
  entradaResumenMap = new Map<number, EntradaInventarioEstadoResumenDto>();

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
    private footerService: FooterService,
    private snackBar: MatSnackBar,
    private router: Router,
    private entradaInventarioService: EntradaInventarioService,
    private metodoPagoService: MetodoPagoService,
    private origenFondosService: OrigenFondosService
  ) {}

  ngOnInit() {
    this.footerService.clearFooterItems();
    this.applyViewport();
    this.loadTiposYProveedores();
    this.loadMetodosPago();
    this.loadOrigenesArbol();
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

  private loadMetodosPago() {
    this.metodoPagoService.obtenerMetodosPagoParaEgresos().subscribe({
      next: (metodos) => {
        this.metodosPago = metodos ?? [];
      }
    });
  }

  origenLabel(egreso: EgresoDto): string {
    if (egreso.origenFondosId != null) {
      const cuenta = this.origenesArbol.find(
        (c) => c.id === egreso.origenFondosId
      );
      if (cuenta) {
        return cuenta.nombreDisplay.replace(/^[─\s]+/, '').trim() || cuenta.nombre;
      }
      return `#${egreso.origenFondosId}`;
    }
    return etiquetaMetodoPagoEgresoPorId(egreso.metodoPagoId, this.metodosPago);
  }

  private loadOrigenesArbol() {
    this.origenFondosService.findArbol().subscribe({
      next: (items) => {
        this.origenesArbol = items ?? [];
      }
    });
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
        this.cargarResumenEntradas();
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
        this.cargarResumenEntradas();
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

  eliminarEgreso(egreso: EgresoDto, event?: Event): void {
    event?.stopPropagation();
    if (this.eliminandoEgresoId !== null) return;

    const referencia = this.referenciaEgreso(egreso);
    const valor = this.formatCurrency(egreso.valor);
    const dialogData: ConfirmDialogData = {
      titulo: 'Confirmar eliminación',
      mensaje: `¿Confirma la acción de eliminar el egreso <b>${referencia}</b> por valor de <b>${valor}</b>?`
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.ejecutarEliminarEgreso(egreso);
      }
    });
  }

  private referenciaEgreso(egreso: EgresoDto): string {
    const proveedor = egreso.proveedor?.nombre?.trim();
    const descripcion = egreso.descripcion?.trim();
    if (proveedor && descripcion) {
      return `${proveedor} — ${descripcion}`;
    }
    if (proveedor) return proveedor;
    if (descripcion) return descripcion;
    return `egreso #${egreso.id}`;
  }

  private ejecutarEliminarEgreso(egreso: EgresoDto): void {
    this.eliminandoEgresoId = egreso.id;
    this.egresosService.eliminar(egreso.id).subscribe({
      next: () => {
        this.eliminandoEgresoId = null;
        if (this.selectedRowId === egreso.id) {
          this.selectedRowId = null;
        }
        this.dataSource = this.dataSource.filter((e) => e.id !== egreso.id);
        this.totalElements = Math.max(0, this.totalElements - 1);
        this.actualizarFooter();
        this.snackBar.open('Egreso eliminado', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.eliminandoEgresoId = null;
        this.snackBar.open(
          'No se pudo eliminar el egreso. Intente de nuevo.',
          'Cerrar',
          { duration: 5000 }
        );
      }
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

  irEntradaInventario(egreso: EgresoDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.permiteEntradaInventario(egreso)) {
      return;
    }
    this.router.navigate([
      '/apps/financiero/egresos',
      egreso.id,
      'entrada-inventario'
    ]);
  }

  permiteEntradaInventario(egreso: EgresoDto): boolean {
    return egresoPermiteEntradaInventario(egreso);
  }

  tooltipEntradaInventario(egresoId: number): string {
    const resumen = this.entradaResumenMap.get(egresoId);
    if (!resumen) {
      return 'Realizar entrada almacén';
    }
    if (resumen.estado === 'CONFIRMADA') {
      return `Entrada confirmada (${resumen.totalItems} ítems)`;
    }
    if (resumen.estado === 'BORRADOR') {
      return `Continuar entrada borrador (${resumen.totalItems} ítems)`;
    }
    return 'Entrada anulada';
  }

  iconoEntradaInventario(egresoId: number): string {
    const resumen = this.entradaResumenMap.get(egresoId);
    if (resumen?.estado === 'CONFIRMADA') {
      return 'mat:check_circle';
    }
    return 'mat:local_shipping';
  }

  private cargarResumenEntradas(): void {
    const ids = this.dataSource
      .filter((e) => this.permiteEntradaInventario(e))
      .map((e) => e.id)
      .filter((id) => id != null);
    if (ids.length === 0) {
      this.entradaResumenMap.clear();
      return;
    }
    this.entradaInventarioService.resumenPorEgresoIds(ids).subscribe({
      next: (items) => {
        this.entradaResumenMap.clear();
        for (const item of items) {
          this.entradaResumenMap.set(item.egresoId, item);
        }
      }
    });
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
