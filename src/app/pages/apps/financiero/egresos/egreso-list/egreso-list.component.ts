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
import {
  PersonaDto,
  PersonaService
} from '../service/persona.service';
import { EgresoEditComponent } from '../egreso-edit/egreso-edit.component';
import { AsociarNotificacionEgresoDialogComponent } from '../asociar-notificacion-egreso-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../../core/components/confirm-dialog/confirm-dialog.component';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';
import { FooterService } from '../../../../../layouts/services/footer.service';
import { ActivatedRoute, Router } from '@angular/router';
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
import {
  labelNaturalezaEgreso,
  NATURALEZAS_EGRESO_FALLBACK
} from '../util/naturaleza-egreso.util';
import {
  NaturalezaTipoEgresoDto,
  NaturalezaTipoEgresoService
} from '../service/naturaleza-tipo-egreso.service';
import { firstValueFrom } from 'rxjs';@Component({
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
    'beneficiario',
    'naturaleza',
    'tipoEgreso',
    'descripcion',
    'entradaInventario',
    'notificacion',
    'edit',
    'delete'
  ];
  dataSource: EgresoDto[] = [];
  metodosPago: MetodoPagoDto[] = [];
  origenesArbol: OrigenFondosArbolItemDto[] = [];
  selectedRowId: number | null = null;
  eliminandoEgresoId: number | null = null;
  exporting = false;
  loading = false;
  loadingMore = false;
  /** Filtros avanzados (observación, tipo, fechas, CSV) — colapsados por defecto. */
  mostrarMasOpciones = false;
  descripcionCtrl = new UntypedFormControl('');
  tipoEgresoIdCtrl = new FormControl<number | ''>('');
  naturalezaCtrl = new FormControl<string | ''>('');
  proveedorIdCtrl = new FormControl<number | ''>('');
  personaIdCtrl = new FormControl<number | ''>('');
  filterFechaInicioCtrl = new FormControl<Date | null>(null);
  filterFechaFinCtrl = new FormControl<Date | null>(null);
  tiposEgreso: TipoEgresoDto[] = [];
  naturalezas: Array<{ value: string; label: string }> = [...NATURALEZAS_EGRESO_FALLBACK];
  proveedores: ProveedorDto[] = [];
  personas: PersonaDto[] = [];
  pageSize = 10;
  pageIndex = 0;
  totalElements = 0;
  hasMore = false;
  tableScrollMaxHeight = 400;
  appliedFechaInicio: string | null = null;
  appliedFechaFin: string | null = null;
  entradaResumenMap = new Map<number, EntradaInventarioEstadoResumenDto>();
  /** Filtro puntual al llegar desde la bandeja de notificación (query ?egresoId=). */
  filtroEgresoId: number | null = null;
  egresoResaltadoId: number | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  private justClosedDialog = false;
  private abriendoNuevoDesdeShortcut = false;

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('tableScroll') tableScroll!: ElementRef<HTMLElement>;

  constructor(
    private egresosService: EgresosService,
    private tipoEgresoService: TipoEgresoService,
    private naturalezaTipoEgresoService: NaturalezaTipoEgresoService,
    private proveedorService: ProveedorService,
    private personaService: PersonaService,
    private dialog: MatDialog,
    private tableViewportService: TableViewportService,
    private fechaUtilService: FechaUtilService,
    private footerService: FooterService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
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
    this.naturalezaCtrl.valueChanges.subscribe(() => this.searchEgresos());
    this.proveedorIdCtrl.valueChanges.subscribe(() => this.searchEgresos());
    this.personaIdCtrl.valueChanges.subscribe(() => this.searchEgresos());
    this.filterFechaInicioCtrl.valueChanges.subscribe(() => this.applyDateFilters());
    this.filterFechaFinCtrl.valueChanges.subscribe(() => this.applyDateFilters());

    // Shortcut Financiero → Crear Egreso: /egresos?nuevo=1
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('nuevo') === '1') {
        this.abrirNuevoEgresoDesdeShortcut();
      }
      const rawId = params.get('egresoId');
      const id = rawId ? Number(rawId) : NaN;
      if (Number.isFinite(id) && id > 0) {
        this.enfocarEgreso(id);
      }
    });
  }

  private abrirNuevoEgresoDesdeShortcut(): void {
    if (this.abriendoNuevoDesdeShortcut) {
      return;
    }
    this.abriendoNuevoDesdeShortcut = true;
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { nuevo: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      })
      .then(() => {
        this.createEgreso();
        this.abriendoNuevoDesdeShortcut = false;
      })
      .catch(() => {
        this.abriendoNuevoDesdeShortcut = false;
      });
  }

  private enfocarEgreso(id: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { egresoId: null, _r: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.egresosService.getEgresoById(id).subscribe({
      next: (egreso) => {
        this.filtroEgresoId = id;
        this.dataSource = [egreso];
        this.hasMore = false;
        this.loading = false;
        this.totalElements = 1;
        this.selectedRowId = id;
        this.cargarResumenEntradas();
        this.actualizarFooter();
        this.flashEgreso(id);
      },
      error: () => {
        this.snackBar.open(`No se encontró el egreso #${id}`, 'Cerrar', {
          duration: 3500
        });
      }
    });
  }

  private flashEgreso(id: number): void {
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
    }
    this.egresoResaltadoId = null;
    setTimeout(() => {
      this.egresoResaltadoId = id;
      this.scrollEgresoIntoView(id);
      this.flashTimer = setTimeout(() => {
        this.egresoResaltadoId = null;
        this.flashTimer = null;
      }, 1800);
    }, 30);
  }

  private scrollEgresoIntoView(id: number): void {
    const root = this.tableScroll?.nativeElement;
    if (!root) {
      return;
    }
    const row = root.querySelector(`[data-egreso-id="${id}"]`) as HTMLElement | null;
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  limpiarFiltroEgresoId(): void {
    this.filtroEgresoId = null;
    this.egresoResaltadoId = null;
    this.searchEgresos();
  }

  private loadMetodosPago() {
    this.metodoPagoService.obtenerMetodosPagoParaEgresos().subscribe({
      next: (metodos) => {
        this.metodosPago = metodos ?? [];
      }
    });
  }

  origenLabel(egreso: EgresoDto): string {
    const ids =
      egreso.origenes?.length
        ? [...egreso.origenes]
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
            .map((o) => o.origenFondosId)
        : egreso.origenFondosId != null
          ? [egreso.origenFondosId]
          : [];
    if (ids.length) {
      return ids
        .map((id) => {
          const cuenta = this.origenesArbol.find((c) => c.id === id);
          if (cuenta) {
            return (
              cuenta.nombreDisplay.replace(/^[─\s]+/, '').trim() || cuenta.nombre
            );
          }
          return `#${id}`;
        })
        .join(', ');
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
    this.personaService.getAll(true).subscribe({
      next: (list) => (this.personas = list || [])
    });
    this.naturalezaTipoEgresoService.getAll(true).subscribe({
      next: (nats: NaturalezaTipoEgresoDto[]) => {
        if (nats?.length) {
          this.naturalezas = nats.map((n) => ({
            value: n.codigo,
            label: n.nombre
          }));
        }
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.attachScrollListener();
    }, 100);
  }

  ngOnDestroy() {
    this.detachScrollListener();
    this.footerService.clearFooterItems();
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
    }
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
    this.filtroEgresoId = null;
    this.egresoResaltadoId = null;
    this.loading = true;
    this.pageIndex = 0;
    const params = this.buildSearchParams(0);

    this.egresosService.searchEgresos(params).subscribe({
      next: (page) => {
        if (this.filtroEgresoId != null) {
          this.loading = false;
          return;
        }
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
    this.naturalezaCtrl.setValue('');
    this.proveedorIdCtrl.setValue('');
    this.personaIdCtrl.setValue('');
    this.filtroEgresoId = null;
    this.clearActiveFilter(false);
    this.searchEgresos();
  }

  tipoEgresoLabel(egreso: EgresoDto): string {
    return (
      egreso.tipoEgreso?.nombre ||
      egreso.proveedor?.tipoEgreso?.nombre ||
      '—'
    );
  }

  beneficiarioLabel(egreso: EgresoDto): string {
    if (egreso.persona?.nombre) {
      return egreso.persona.documento
        ? `${egreso.persona.nombre} (${egreso.persona.documento})`
        : egreso.persona.nombre;
    }
    return egreso.proveedor?.nombre || '—';
  }

  naturalezaLabel(egreso: EgresoDto): string {
    return labelNaturalezaEgreso(
      egreso.naturaleza,
      this.naturalezas.map((n) => ({ codigo: n.value, nombre: n.label }))
    );
  }

  async exportarCsv(): Promise<void> {
    if (this.exporting) {
      return;
    }
    this.exporting = true;
    try {
      const rows: EgresoDto[] = [];
      let page = 0;
      let last = false;
      while (!last) {
        const resp = await firstValueFrom(
          this.egresosService.searchEgresos({
            ...this.buildSearchParams(page),
            size: 200
          })
        );
        rows.push(...(resp.content || []));
        last = resp.last || (resp.content?.length ?? 0) === 0;
        page += 1;
        if (page > 100) {
          break;
        }
      }
      if (rows.length === 0) {
        this.snackBar.open('No hay egresos para exportar', 'Cerrar', {
          duration: 3000
        });
        return;
      }
      const header = [
        'id',
        'fecha',
        'valor',
        'beneficiario',
        'documento_beneficiario',
        'tipo_beneficiario',
        'naturaleza',
        'naturaleza_nombre',
        'tipo',
        'origen_fondos_id',
        'origen',
        'observacion'
      ];
      const lines = [
        header.join(','),
        ...rows.map((e) =>
          [
            e.id,
            e.fecha,
            e.valor,
            this.csvEscape(
              e.persona?.nombre || e.proveedor?.nombre || ''
            ),
            this.csvEscape(
              e.persona?.documento || e.proveedor?.documento || ''
            ),
            this.csvEscape(e.persona?.id ? 'persona' : 'proveedor'),
            this.csvEscape(String(e.naturaleza || '')),
            this.csvEscape(this.naturalezaLabel(e)),
            this.csvEscape(this.tipoEgresoLabel(e)),
            e.origenes?.length
              ? e.origenes.map((o) => o.origenFondosId).join('|')
              : e.origenFondosId ?? '',
            this.csvEscape(this.origenLabel(e)),
            this.csvEscape(e.descripcion || '')
          ].join(',')
        )
      ];
      const blob = new Blob(['\ufeff' + lines.join('\n')], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `egresos-${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.snackBar.open(`Exportados ${rows.length} egresos`, 'Cerrar', {
        duration: 3000
      });
    } catch {
      this.snackBar.open('No se pudo exportar', 'Cerrar', { duration: 4000 });
    } finally {
      this.exporting = false;
    }
  }

  private csvEscape(value: string): string {
    const v = value.replace(/"/g, '""');
    return `"${v}"`;
  }

  createEgreso() {
    const dialogRef = this.dialog.open(EgresoEditComponent, {
      width: '640px',
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

  puedeAsociarNotificacion(egreso: EgresoDto): boolean {
    return (
      !!egreso?.id &&
      egreso.notificacionEmailPagoId == null &&
      egreso.fromMovimientoOrigenFondosId == null
    );
  }

  asociarNotificacion(egreso: EgresoDto, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeAsociarNotificacion(egreso)) {
      return;
    }
    const ref = this.dialog.open(AsociarNotificacionEgresoDialogComponent, {
      width: '480px',
      data: {
        egresoId: egreso.id,
        valor: egreso.valor,
        fecha: egreso.fecha
      }
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.snackBar.open(
          `Notificación #${updated.id} asociada al egreso #${egreso.id}`,
          'Cerrar',
          { duration: 3000 }
        );
        this.searchEgresos();
      }
    });
  }

  editEgreso(egreso: EgresoDto) {
    const dialogRef = this.dialog.open(EgresoEditComponent, {
      width: '640px',
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

  applyDateFilters(): void {
    const fechaInicio = this.formatDateParam(this.filterFechaInicioCtrl.value);
    const fechaFin = this.formatDateParam(this.filterFechaFinCtrl.value);

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      return;
    }

    this.appliedFechaInicio = fechaInicio;
    this.appliedFechaFin = fechaFin;
    this.searchEgresos();
  }

  clearActiveFilter(triggerSearch = true): void {
    this.appliedFechaInicio = null;
    this.appliedFechaFin = null;
    this.filterFechaInicioCtrl.setValue(null, { emitEvent: false });
    this.filterFechaFinCtrl.setValue(null, { emitEvent: false });
    if (triggerSearch) {
      this.searchEgresos();
    }
  }

  private focusSearchInput() {
    if (!this.mostrarMasOpciones || !this.searchInput?.nativeElement) {
      return;
    }
    const input = this.searchInput.nativeElement;
    setTimeout(() => {
      input.focus();
      if (this.descripcionCtrl.value) {
        input.select();
      }
    }, 100);
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
      naturaleza:
        this.naturalezaCtrl.value !== ''
          ? String(this.naturalezaCtrl.value)
          : undefined,
      proveedorId:
        this.proveedorIdCtrl.value !== ''
          ? Number(this.proveedorIdCtrl.value)
          : undefined,
      personaId:
        this.personaIdCtrl.value !== ''
          ? Number(this.personaIdCtrl.value)
          : undefined,
      fechaInicio: this.appliedFechaInicio ?? undefined,
      fechaFin: this.appliedFechaFin ?? undefined,
      page,
      size: this.pageSize
    };
  }

  private formatDateParam(value: Date | null): string | null {
    if (!value) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
