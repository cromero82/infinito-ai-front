import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectorRef,
  afterNextRender,
  inject,
  Injector
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { RelationalProductService } from '../service/relational-product.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgFor, NgIf, DecimalPipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Producto, ProductPage } from '../model/producto';
import { EMPTY, from, of, throwError } from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
  tap
} from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { UntypedFormControl, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import * as RecordRTC from 'recordrtc';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { EditarProductoComponent } from '../editar-producto/editar-producto.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import { ConfigurationService } from '../../../../auth/service/configuration.service';
import { UsuarioPerfilService } from '../../../../auth/service/usuario-perfil.service';
import { FechaUtilService, FechaRelativaTableResult } from '../../ventas/service/fecha-util.service';
import { GoogleSearchButtonComponent } from '../../../../@vex/components/google-search-button';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GrupoEspejoService } from '../service/grupo-espejo.service';
import { GrupoEspejoDto } from '../model/grupo-espejo';
import {
  SeleccionarCrearGrupoEspejoComponent,
  SeleccionarCrearGrupoEspejoDialogData,
  SeleccionarCrearGrupoEspejoDialogResult
} from '../seleccionar-crear-grupo-espejo/seleccionar-crear-grupo-espejo.component';
import { TableViewportService } from '../../../../core/table-viewport/table-viewport.service';
import { BarcodeScannerDialogComponent } from '../barcode-scanner-dialog/barcode-scanner-dialog.component';

/** Producto resumido en el panel de grupo espejo */
export interface GrupoEspejoProductoPanel {
  id: number;
  nombre: string;
  precio?: number | null;
  precioUnidad?: number | null;
  precioCompra?: number | null;
  porcentajeGanancia?: number | null;
}

/** Estado del panel de edición de grupo espejo (misma pantalla) */
export interface GrupoEspejoEdicionState {
  id: number;
  nombre: string;
  productos: GrupoEspejoProductoPanel[];
}

export interface FilterCondition {
  campo: string;
  condicion: string;
  valor: any;
  label?: string; // Solo para mostrar en la interfaz
}


@Component({
    selector: 'lista-productos',
    imports: [
        MatButtonModule,
        MatTooltipModule,
        MatTableModule,
        MatSortModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatPaginatorModule,
        ReactiveFormsModule,
        FormsModule,
        NgFor,
        NgIf,
        DecimalPipe,
        CommonModule,
        GoogleSearchButtonComponent,
        MatSelectModule,
        MatMenuModule,
        MatChipsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCheckboxModule,
        MatSnackBarModule
    ],
    templateUrl: './lista-productos.component.html',
    styleUrls: ['./lista-productos.component.scss']
})
export class ListaProductosComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly injector = inject(Injector);

  displayedColumns: string[] = [
    'id', 'nombre', 'precio', 'precioUnidad', 'fechaUltimaActualizacionPrecio', 'totalVentas', 'edit'
  ];

  /** Columnas configurables en el orden de la tabla (clave para verTabla en API) */
  readonly allTableColumns: { key: string; label: string }[] = [
    { key: 'barcode', label: 'Código barras' },
    { key: 'nombre', label: 'Producto' },
    { key: 'precio', label: 'Precio' },
    { key: 'precioUnidad', label: 'Precio unidad' },
    { key: 'precioCompra', label: 'Precio compra' },
    { key: 'fechaUltimaActualizacionPrecio', label: 'Actualización precio' },
    { key: 'fechaCreacion', label: 'Fecha creacion' },
    { key: 'totalVentas', label: 'Total ventas' },
    { key: 'porcentaje_ganancia', label: '% Ganancia' },
    { key: 'fecha_ultima_venta', label: 'Última venta' }
  ];

  /** Estado temporal de columnas visibles en el menú (antes de aplicar) */
  columnVisibilitySelection: Record<string, boolean> = {};
  savingColumnConfig = false;
  dataSource: any[] = [];
  totalElements = 0;
  loading = false;
  loadingMore = false;
  totalPages = 0;
  pageSize = 20;
  pageIndex = 0;
  searchCtrl = new UntypedFormControl('');
  private justClosedDialog = false; // Flag to prevent auto-edit after dialog closes
  /** Selección de filas (clic simple = una fila; Ctrl/Cmd + clic = varias). */
  private readonly selectedProductIds = new Set<number>();

  // Variables para icono copiar en código de barras
  hoveredBarcodeRowIndex: number | null = null;
  copiedBarcodeRowIndex: number | null = null;

  // Variables para edición inline
  editingProductNameIndex = -1;
  editingProductPriceIndex = -1;
  private startingEdit = false;
  private lastClickTime = 0;
  private isDoubleClickActive = false;
  editingProductNameCtrl = new FormControl<string>('', { nonNullable: true });
  editingProductPriceCtrl = new FormControl<string>('', { nonNullable: true });

  // Variables para filtros y ordenamiento
  activeFilters: FilterCondition[] = [];

  /** Porcentaje del total (de busquedaPorFiltros) cuando hay filtros activos */
  percentFromTotal: number | null = null;

  // Controles unificados de filtros (todos los campos uno debajo del otro)
  filterPrecioCondCtrl = new FormControl<string>('=', { nonNullable: true });
  filterPrecioValorCtrl = new FormControl<string>('');

  filterGananciaPresetCtrl = new FormControl<string>('');
  filterGananciaCondCtrl = new FormControl<string>('=', { nonNullable: true });
  filterGananciaValorCtrl = new FormControl<string>('');

  filterFechaActPrecioPresetCtrl = new FormControl<string>('');
  filterFechaActPrecioCustomCondCtrl = new FormControl<string>('=', { nonNullable: true });
  filterFechaActPrecioCustomDateCtrl = new FormControl<Date | null>(null);

  filterTotalVentasCondCtrl = new FormControl<string>('=', { nonNullable: true });
  filterTotalVentasValorCtrl = new FormControl<string>('');

  filterFechaUltimaVentaPresetCtrl = new FormControl<string>('');
  filterFechaUltimaVentaCustomCondCtrl = new FormControl<string>('=', { nonNullable: true });
  filterFechaUltimaVentaCustomDateCtrl = new FormControl<Date | null>(null);

  filterFechaCreacionPresetCtrl = new FormControl<string>('');
  filterFechaCreacionCustomCondCtrl = new FormControl<string>('=', { nonNullable: true });
  filterFechaCreacionCustomDateCtrl = new FormControl<Date | null>(null);

  /** Ver únicamente productos activos (deshabilitado por defecto) */
  filterVerSoloActivosCtrl = new FormControl<boolean>(false, { nonNullable: true });

  /** Modo edición: panel de grupo espejo (productos equivalentes) */
  grupoEspejoEdicion: GrupoEspejoEdicionState | null = null;
  grupoEspejoBusy = false;
  /** Producto al que se está aplicando PUT de vinculación desde la tabla */

  /** Edición del nombre del grupo en el panel */
  grupoEspejoEditandoNombre = false;
  grupoEspejoNombreCtrl = new FormControl<string>('', { nonNullable: true });
  grupoEspejoGuardandoNombre = false;

  /** Menú tipo tooltip: desglose de precios al pasar el ratón */
  private precioPopoverCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private precioPopoverTrigger: MatMenuTrigger | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  // Reference to the trigger button so we can close the menu programmatically
  @ViewChild('filtersMenuTrigger') filtersMenuTrigger!: MatMenuTrigger;
  @ViewChild('columnVisibilityMenuTrigger') columnVisibilityMenuTrigger!: MatMenuTrigger;
  @ViewChild('tableScroll') tableScroll!: ElementRef<HTMLElement>;

  recording = false;
  private recorder: any = null;
  private stream: MediaStream | null = null;

  constructor(
    private relationalProductService: RelationalProductService,
    private http: HttpClient,
    private dialog: MatDialog,
    private configurationService: ConfigurationService,
    private usuarioPerfilService: UsuarioPerfilService,
    private fechaUtilService: FechaUtilService,
    private cdr: ChangeDetectorRef,
    private grupoEspejoService: GrupoEspejoService,
    private snackBar: MatSnackBar,
    private tableViewportService: TableViewportService
  ) { }

  minHeightPanelProductosValue = 420;

  ngOnInit() {
    this.applyViewport();
    this.configurationService.obtenerTodasConfiguraciones().subscribe({
      next: () => this.loadMinHeightConfiguration(),
      error: () => this.loadMinHeightConfiguration()
    });
    this.loadMinHeightConfiguration();
    // Load personal column configuration (from login flow) before fetching products
    this.loadPersonalColumnConfig();
    this.fetchProducts();
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        // Reset flag when user types in search (allows auto-edit)
        this.justClosedDialog = false;
        this.fetchProducts(true, true);
      });
  }

  sortData(sort: Sort) {
    this.fetchProducts(true);
  }

  private loadMinHeightConfiguration(): void {
    const longitudConfig = localStorage.getItem('longitud-vertical-panel-productos');
    if (longitudConfig && longitudConfig.trim() !== '') {
      const valorNumerico = Number(longitudConfig);
      if (!Number.isNaN(valorNumerico) && valorNumerico > 0) {
        this.minHeightPanelProductosValue = valorNumerico;
      }
    }
    this.cdr.markForCheck();
  }

  /** Mapeo de columna template -> clave API para verTabla */
  private readonly columnDefToApiKey: Record<string, string> = {
    'id': 'barcode',
    'nombre': 'nombre',
    'precio': 'precio',
    'precioUnidad': 'precioUnidad',
    'precioCompra': 'precioCompra',
    'fechaUltimaActualizacionPrecio': 'fechaUltimaActualizacionPrecio',
    'fechaCreacion': 'fechaCreacion',
    'totalVentas': 'totalVentas',
    'porcentajeGanancia': 'porcentaje_ganancia',
    'fechaUltimaVenta': 'fecha_ultima_venta'
  };

  /** Mapeo columna sort -> campo API para ordenamiento (busquedaPorFiltros) */
  private readonly sortFieldToApiField: Record<string, string> = {
    'id': 'barcode'
  };

  /** Mapeo campo filtro interno -> campo API para busquedaPorFiltros */
  private readonly filterCampoToApiField: Record<string, string> = {
    'porcentaje_ganancia': 'porcentajeGanancia',
    'fecha_ultima_venta': 'fechaUltimaVenta'
  };

  /** Columnas de fecha: el backend debe ordenar por valor de fecha, no por string */
  private readonly dateSortColumns = new Set(['fechaUltimaActualizacionPrecio', 'fechaCreacion', 'fechaUltimaVenta']);

  /** Mapeo de clave API -> columna template (para menú de visibilidad) */
  private getColumnDefFromKey(key: string): string {
    if (key === 'barcode') return 'id';
    if (key === 'fecha_ultima_venta') return 'fechaUltimaVenta';
    if (key === 'porcentaje_ganancia') return 'porcentajeGanancia';
    return key;
  }

  /**
   * Load personal columns configuration from localStorage key `configuraciones-personales`.
   * Expected structure: { productos: { verTabla: "col1,col2,..." } }
   */
  private loadPersonalColumnConfig(): void {
    try {
      const raw = localStorage.getItem('configuraciones-personales');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const verTabla = parsed?.productos?.verTabla;
      if (!verTabla || typeof verTabla !== 'string') return;

      const cols = verTabla.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

      // Columns actually present in the template (matColumnDef values)
      const availableDefs = new Set<string>([
        'id',
        'nombre',
        'precio',
        'precioUnidad',
        'precioCompra',
        'fechaUltimaActualizacionPrecio',
        'fechaCreacion',
        'totalVentas',
        'porcentajeGanancia',
        'fechaUltimaVenta',
        'edit'
      ]);

      // Map common logical names to actual column defs in the template
      const aliasMap: Record<string, string> = {
        'barcode': 'id',
        'id': 'id',
        'nombre': 'nombre',
        'precio': 'precio',
        'precioUnidad': 'precioUnidad',
        'fechaUltimaActualizacionPrecio': 'fechaUltimaActualizacionPrecio',
        'fechaCreacion': 'fechaCreacion',
        'totalVentas': 'totalVentas',
        'precioCompra': 'precioCompra',
        'porcentaje_ganancia': 'porcentajeGanancia',
        'fecha_ultima_venta': 'fechaUltimaVenta'
      };

      const mapped: string[] = [];
      for (const c of cols) {
        const mappedCol = aliasMap[c] || c;
        if (availableDefs.has(mappedCol) && !mapped.includes(mappedCol)) {
          mapped.push(mappedCol);
        }
      }

      const result: string[] = [];
      // ensure id first (if present in mapped), otherwise keep defaults
      if (mapped.includes('id')) {
        result.push('id');
      } else if (availableDefs.has('id')) {
        result.push('id');
      }

      for (const col of mapped) {
        if (col === 'id' || col === 'edit') continue;
        result.push(col);
      }

      // ensure edit/action column at the end
      if (availableDefs.has('edit')) {
        result.push('edit');
      }

      if (result.length > 0) {
        this.displayedColumns = result;
        this.cdr.markForCheck();
      }
    } catch (e) {
      console.warn('No se pudo parsear configuraciones-personales:', e);
    }
  }

  getMinHeightValue(): number {
    return this.minHeightPanelProductosValue;
  }

  getMaxHeightListValue(): number {
    const headerHeight = 34;
    const calculatedHeight = this.minHeightPanelProductosValue - headerHeight;
    return Math.max(200, calculatedHeight);
  }

  ngAfterViewInit() {
    setTimeout(() => this.applyViewport(), 100);
    afterNextRender(
      () => this.focusSearchOnInitialLoad(),
      { injector: this.injector }
    );
  }

  /** Foco en búsqueda al abrir la vista (reintentos: toolbar/layout quitan el foco a veces). */
  private focusSearchOnInitialLoad(): void {
    const el = this.searchInput?.nativeElement;
    if (!el) {
      return;
    }
    const focusOnce = (): void => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
    };
    focusOnce();
    requestAnimationFrame(focusOnce);
    setTimeout(focusOnce, 0);
    setTimeout(focusOnce, 120);
    setTimeout(focusOnce, 400);
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.applyViewport();
  }

  /**
   * TableViewportService: pageSize para infinite scroll. El servicio puede proponer pocos ítems
   * (viewport pequeño); no bajar de 20 filas por página para no “encoger” el listado.
   */
  private applyViewport() {
    const v = this.tableViewportService.calculate({
      reservedHeight: 388,
      rowHeight: 28
    });
    this.pageSize = Math.max(20, v.pageSize);
  }

  private maybeLoadMoreIfNoScroll() {
    if (this.loading || this.loadingMore) return;
    if (this.totalPages <= 0 || this.pageIndex + 1 >= this.totalPages) return;
    const el = this.tableScroll?.nativeElement;
    if (!el) return;
    const { scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 10) {
      this.fetchProducts(false);
    }
  }

  ngOnDestroy(): void {
    this.clearPrecioPopoverCloseTimer();
  }

  /**
   * Handle keyboard events for "-" key to delete selected product
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Check for minus key (support both regular minus and numeric keypad minus)
    const isMinusKey = event.key === '-' ||
      event.key === 'Minus' ||
      event.code === 'Minus' ||
      event.code === 'NumpadSubtract';

    // Solo eliminar con "-" si hay exactamente un producto seleccionado
    if (isMinusKey && this.selectedProductIds.size === 1) {
      const target = event.target as HTMLElement;
      // Don't delete if user is typing in search input or other inputs
      if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        // Additional check: don't delete if the input is focused
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.deleteSelectedProduct();
      }
    }
  }

  /**
   * Selección de fila: clic = solo esa fila (o deseleccionar si ya era la única);
   * Ctrl/Cmd + clic = añadir o quitar de la selección múltiple.
   */
  onRowClick(product: Producto, event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target && (target.classList.contains('product-name-input') ||
      target.classList.contains('product-price-input'))) {
      return;
    }

    if (this.startingEdit ||
      this.editingProductNameIndex !== -1 ||
      this.editingProductPriceIndex !== -1 ||
      this.isDoubleClickActive) {
      return;
    }

    const id = product.id;
    if (id == null) {
      return;
    }

    const multi = event.ctrlKey || event.metaKey;
    if (multi) {
      if (this.selectedProductIds.has(id)) {
        this.selectedProductIds.delete(id);
      } else {
        this.selectedProductIds.add(id);
      }
    } else {
      if (this.selectedProductIds.size === 1 && this.selectedProductIds.has(id)) {
        this.selectedProductIds.clear();
      } else {
        this.selectedProductIds.clear();
        this.selectedProductIds.add(id);
      }
    }
    this.cdr.markForCheck();
  }

  /**
   * Handle mouse down on row to prevent click events during double click
   */
  onRowMouseDown(index: number, event: MouseEvent): void {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastClickTime;

    // Si es un doble clic (menos de 300ms entre clics), prevenir el click
    if (timeDiff < 300) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.lastClickTime = currentTime;
  }

  /**
   * Check if a product row is selected
   */
  isRowSelected(product: Producto): boolean {
    return product.id != null && this.selectedProductIds.has(product.id);
  }

  /**
   * Delete the selected product
   */
  deleteSelectedProduct() {
    if (this.selectedProductIds.size !== 1) {
      if (this.selectedProductIds.size > 1) {
        this.snackBar.open(
          'Para eliminar con la tecla «-», seleccione un solo producto (sin Ctrl).',
          'Cerrar',
          { duration: 5000 }
        );
      }
      return;
    }

    const productId = [...this.selectedProductIds][0];
    if (confirm(`¿Está seguro de que desea eliminar el producto con ID ${productId}?`)) {
      this.loading = true;
      this.relationalProductService.deleteProduct(productId)
        .pipe(finalize(() => {
          this.loading = false;
          this.selectedProductIds.clear();
        }))
        .subscribe({
          next: () => {
            // Refresh the product list
            this.fetchProducts();
            // Focus back on search input
            this.focusSearchInput();
          },
          error: (err) => {
            alert('Error al eliminar el producto: ' + (err?.error?.message || err.message || err));
            this.focusSearchInput();
          }
        });
    }
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /** Valida que un valor sea un porcentaje válido entre -100 y 100 */
  isValidPercent(value: string | number | null | undefined): boolean {
    if (value === '' || value === null || value === undefined) return true;
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(n)) return false;
    return n >= -100 && n <= 100;
  }

  /** Indica si hay algún valor en los controles del menú de filtros */
  hasAnyFilterValue(): boolean {
    return !!(
      this.filterPrecioValorCtrl.value ||
      this.filterGananciaPresetCtrl.value ||
      this.filterGananciaValorCtrl.value ||
      this.filterFechaActPrecioPresetCtrl.value ||
      this.filterTotalVentasValorCtrl.value ||
      this.filterFechaUltimaVentaPresetCtrl.value ||
      this.filterFechaCreacionPresetCtrl.value
    );
  }

  /**
   * Recopila todos los filtros desde los controles y los aplica a activeFilters.
   * Reemplaza los filtros existentes por los nuevos.
   */
  private collectFiltersFromControls(): FilterCondition[] {
    const filters: FilterCondition[] = [];
    const today = new Date();

    // Precio
    const precioVal = this.filterPrecioValorCtrl.value;
    const precioStr = typeof precioVal === 'number' ? String(precioVal) : (precioVal ?? '').toString().trim();
    if (precioStr) {
      const n = parseFloat(precioStr.replace(',', '.'));
      if (!isNaN(n) && n >= 0) {
        filters.push({
          campo: 'precio',
          condicion: this.filterPrecioCondCtrl.value,
          valor: String(n),
          label: `Precio ${this.filterPrecioCondCtrl.value} ${n}`
        });
      }
    }

    // % Ganancia: preset "no_calcular" (precioCompra = 0) o "personalizado" (valor numérico)
    const gananciaPreset = this.filterGananciaPresetCtrl.value;
    if (gananciaPreset === 'no_calcular') {
      filters.push({
        campo: 'precioCompra',
        condicion: '=',
        valor: '0',
        label: 'No se puede calcular % (sin precio compra)'
      });
    } else if (gananciaPreset === 'personalizado') {
      const gananciaVal = this.filterGananciaValorCtrl.value;
      const gananciaStr = typeof gananciaVal === 'number' ? String(gananciaVal) : (gananciaVal ?? '').toString().trim();
      if (gananciaStr && this.isValidPercent(gananciaStr)) {
        const n = parseFloat(gananciaStr.replace(',', '.'));
        if (!isNaN(n)) {
          filters.push({
            campo: 'porcentaje_ganancia',
            condicion: this.filterGananciaCondCtrl.value,
            valor: String(n),
            label: `% Ganancia ${this.filterGananciaCondCtrl.value} ${n}%`
          });
        }
      }
    }

    // Fecha actualización precio
    const presetActPrecio = this.filterFechaActPrecioPresetCtrl.value;
    if (presetActPrecio) {
      if (presetActPrecio === 'nunca') {
        filters.push({ campo: 'fechaUltimaActualizacionPrecio', condicion: '=', valor: 'null', label: 'Fecha act. precio Nunca' });
      } else if (presetActPrecio === 'mas_2_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 2);
        filters.push({ campo: 'fechaUltimaActualizacionPrecio', condicion: '<=', valor: this.formatDate(d), label: 'Fecha act. precio > 2 meses sin act.' });
      } else if (presetActPrecio === 'mas_4_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 4);
        filters.push({ campo: 'fechaUltimaActualizacionPrecio', condicion: '<=', valor: this.formatDate(d), label: 'Fecha act. precio > 4 meses sin act.' });
      } else if (presetActPrecio === 'menos_2_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 2);
        filters.push({ campo: 'fechaUltimaActualizacionPrecio', condicion: '>', valor: this.formatDate(d), label: 'Fecha act. precio < 2 meses' });
      } else if (presetActPrecio === 'personalizado') {
        const customDate = this.filterFechaActPrecioCustomDateCtrl.value;
        const customCond = this.filterFechaActPrecioCustomCondCtrl.value;
        if (customDate && customCond) {
          filters.push({
            campo: 'fechaUltimaActualizacionPrecio',
            condicion: customCond,
            valor: this.formatDate(customDate),
            label: `Fecha act. precio ${customCond} ${this.formatDate(customDate)}`
          });
        }
      }
    }

    // Total ventas
    const totalVentasVal = this.filterTotalVentasValorCtrl.value;
    const totalVentasStr = typeof totalVentasVal === 'number' ? String(totalVentasVal) : (totalVentasVal ?? '').toString().trim();
    if (totalVentasStr) {
      const n = parseFloat(totalVentasStr.replace(',', '.'));
      if (!isNaN(n) && n >= 0) {
        filters.push({
          campo: 'totalVentas',
          condicion: this.filterTotalVentasCondCtrl.value,
          valor: String(Math.floor(n)),
          label: `Total ventas ${this.filterTotalVentasCondCtrl.value} ${Math.floor(n)}`
        });
      }
    }

    // Última venta
    const presetUltimaVenta = this.filterFechaUltimaVentaPresetCtrl.value;
    if (presetUltimaVenta) {
      if (presetUltimaVenta === 'nunca') {
        filters.push({ campo: 'fecha_ultima_venta', condicion: '=', valor: 'null', label: 'Última venta Nunca' });
      } else if (presetUltimaVenta === 'mas_2_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 2);
        filters.push({ campo: 'fecha_ultima_venta', condicion: '<=', valor: this.formatDate(d), label: 'Última venta > 2 meses' });
      } else if (presetUltimaVenta === 'mas_4_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 4);
        filters.push({ campo: 'fecha_ultima_venta', condicion: '<=', valor: this.formatDate(d), label: 'Última venta > 4 meses' });
      } else if (presetUltimaVenta === 'menos_2_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 2);
        filters.push({ campo: 'fecha_ultima_venta', condicion: '>', valor: this.formatDate(d), label: 'Última venta < 2 meses' });
      } else if (presetUltimaVenta === 'personalizado') {
        const customDate = this.filterFechaUltimaVentaCustomDateCtrl.value;
        const customCond = this.filterFechaUltimaVentaCustomCondCtrl.value;
        if (customDate && customCond) {
          filters.push({
            campo: 'fecha_ultima_venta',
            condicion: customCond,
            valor: this.formatDate(customDate),
            label: `Última venta ${customCond} ${this.formatDate(customDate)}`
          });
        }
      }
    }

    // Fecha de creación
    const presetCreacion = this.filterFechaCreacionPresetCtrl.value;
    if (presetCreacion) {
      if (presetCreacion === 'mas_2_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 2);
        filters.push({ campo: 'fechaCreacion', condicion: '<=', valor: this.formatDate(d), label: 'Fecha creación > 2 meses' });
      } else if (presetCreacion === 'mas_4_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 4);
        filters.push({ campo: 'fechaCreacion', condicion: '<=', valor: this.formatDate(d), label: 'Fecha creación > 4 meses' });
      } else if (presetCreacion === 'menos_2_meses') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 2);
        filters.push({ campo: 'fechaCreacion', condicion: '>', valor: this.formatDate(d), label: 'Fecha creación < 2 meses' });
      } else if (presetCreacion === 'personalizado') {
        const customDate = this.filterFechaCreacionCustomDateCtrl.value;
        const customCond = this.filterFechaCreacionCustomCondCtrl.value;
        if (customDate && customCond) {
          filters.push({
            campo: 'fechaCreacion',
            condicion: customCond,
            valor: this.formatDate(customDate),
            label: `Fecha creación ${customCond} ${this.formatDate(customDate)}`
          });
        }
      }
    }

    return filters;
  }

  /**
   * Handler del botón Aplicar: evita que el mat-menu cierre antes de ejecutar la lógica.
   * Usa setTimeout para asegurar que el procesamiento ocurra tras el ciclo de eventos.
   */
  onApplyFiltersClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    setTimeout(() => this.applyAllFiltersAndClose(), 0);
  }

  /** Aplica todos los filtros desde los controles, actualiza activeFilters, hace fetch y cierra el menú */
  applyAllFiltersAndClose(): void {
    const filters = this.collectFiltersFromControls();
    // No aplicar % Ganancia personalizado si el valor no es válido
    if (this.filterGananciaPresetCtrl.value === 'personalizado') {
      const gVal = this.filterGananciaValorCtrl.value;
      const gStr = typeof gVal === 'number' ? String(gVal) : (gVal ?? '').toString().trim();
      if (gStr && !this.isValidPercent(gStr)) {
        return; // El hint ya indica el error
      }
    }
    this.activeFilters = filters;
    this.fetchProducts(true);
    setTimeout(() => this.filtersMenuTrigger?.closeMenu(), 100);
  }

  /** Limpia todos los controles del menú de filtros y activeFilters */
  clearAllFiltersInMenu(): void {
    this.filterPrecioCondCtrl.setValue('=', { emitEvent: false });
    this.filterPrecioValorCtrl.setValue('', { emitEvent: false });
    this.filterGananciaPresetCtrl.setValue('', { emitEvent: false });
    this.filterGananciaCondCtrl.setValue('=', { emitEvent: false });
    this.filterGananciaValorCtrl.setValue('', { emitEvent: false });
    this.filterFechaActPrecioPresetCtrl.setValue('', { emitEvent: false });
    this.filterFechaActPrecioCustomCondCtrl.setValue('=', { emitEvent: false });
    this.filterFechaActPrecioCustomDateCtrl.setValue(null, { emitEvent: false });
    this.filterTotalVentasCondCtrl.setValue('=', { emitEvent: false });
    this.filterTotalVentasValorCtrl.setValue('', { emitEvent: false });
    this.filterFechaUltimaVentaPresetCtrl.setValue('', { emitEvent: false });
    this.filterFechaUltimaVentaCustomCondCtrl.setValue('=', { emitEvent: false });
    this.filterFechaUltimaVentaCustomDateCtrl.setValue(null, { emitEvent: false });
    this.filterFechaCreacionPresetCtrl.setValue('', { emitEvent: false });
    this.filterFechaCreacionCustomCondCtrl.setValue('=', { emitEvent: false });
    this.filterFechaCreacionCustomDateCtrl.setValue(null, { emitEvent: false });
    this.filterVerSoloActivosCtrl.setValue(false, { emitEvent: false });
    this.activeFilters = [];
    this.percentFromTotal = null;
    this.fetchProducts(true);
    setTimeout(() => this.filtersMenuTrigger?.closeMenu(), 100);
  }

  /**
   * Restaura el estado de todos los controles del menú desde activeFilters.
   * Se llama al abrir el menú.
   */
  restoreAllFiltersState(): void {
    for (const f of this.activeFilters) {
      if (f.campo === 'precio') {
        this.filterPrecioCondCtrl.setValue(f.condicion, { emitEvent: false });
        this.filterPrecioValorCtrl.setValue(String(f.valor ?? ''), { emitEvent: false });
      } else if (f.campo === 'precioCompra' && f.condicion === '=' && f.valor === '0') {
        this.filterGananciaPresetCtrl.setValue('no_calcular', { emitEvent: false });
      } else if (f.campo === 'porcentaje_ganancia') {
        this.filterGananciaPresetCtrl.setValue('personalizado', { emitEvent: false });
        this.filterGananciaCondCtrl.setValue(f.condicion, { emitEvent: false });
        this.filterGananciaValorCtrl.setValue(String(f.valor ?? ''), { emitEvent: false });
      } else if (f.campo === 'fechaUltimaActualizacionPrecio') {
        if (f.valor === 'null') {
          this.filterFechaActPrecioPresetCtrl.setValue('nunca', { emitEvent: false });
        } else {
          const preset = this.inferDatePresetFromFilter(f, 'mas_2_meses', 'mas_4_meses', 'menos_2_meses');
          if (preset) {
            this.filterFechaActPrecioPresetCtrl.setValue(preset, { emitEvent: false });
          } else {
            this.filterFechaActPrecioPresetCtrl.setValue('personalizado', { emitEvent: false });
            this.filterFechaActPrecioCustomCondCtrl.setValue(f.condicion, { emitEvent: false });
            const parsed = this.parseDateFromValor(f.valor);
            if (parsed) this.filterFechaActPrecioCustomDateCtrl.setValue(parsed, { emitEvent: false });
          }
        }
      } else if (f.campo === 'totalVentas') {
        this.filterTotalVentasCondCtrl.setValue(f.condicion, { emitEvent: false });
        this.filterTotalVentasValorCtrl.setValue(String(f.valor ?? ''), { emitEvent: false });
      } else if (f.campo === 'fecha_ultima_venta') {
        if (f.valor === 'null') {
          this.filterFechaUltimaVentaPresetCtrl.setValue('nunca', { emitEvent: false });
        } else {
          const preset = this.inferDatePresetFromFilter(f, 'mas_2_meses', 'mas_4_meses', 'menos_2_meses');
          if (preset) {
            this.filterFechaUltimaVentaPresetCtrl.setValue(preset, { emitEvent: false });
          } else {
            this.filterFechaUltimaVentaPresetCtrl.setValue('personalizado', { emitEvent: false });
            this.filterFechaUltimaVentaCustomCondCtrl.setValue(f.condicion, { emitEvent: false });
            const parsed = this.parseDateFromValor(f.valor);
            if (parsed) this.filterFechaUltimaVentaCustomDateCtrl.setValue(parsed, { emitEvent: false });
          }
        }
      } else if (f.campo === 'fechaCreacion') {
        const preset = this.inferDatePresetFromFilter(f, 'mas_2_meses', 'mas_4_meses', 'menos_2_meses');
        if (preset) {
          this.filterFechaCreacionPresetCtrl.setValue(preset, { emitEvent: false });
        } else {
          this.filterFechaCreacionPresetCtrl.setValue('personalizado', { emitEvent: false });
          this.filterFechaCreacionCustomCondCtrl.setValue(f.condicion, { emitEvent: false });
          const parsed = this.parseDateFromValor(f.valor);
          if (parsed) this.filterFechaCreacionCustomDateCtrl.setValue(parsed, { emitEvent: false });
        }
      }
    }
  }

  private parseDateFromValor(valor: any): Date | null {
    if (!valor) return null;
    const str = String(valor);
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  private inferDatePresetFromFilter(f: FilterCondition, key2: string, key4: string, keyMenos: string): string | null {
    const label = (f.label || '').toLowerCase();
    if (label.includes('> 2') || label.includes('>2')) return key2;
    if (label.includes('> 4') || label.includes('>4')) return key4;
    if (label.includes('< 2') || label.includes('<2')) return keyMenos;
    return null;
  }

  removeFilter(filter: FilterCondition): void {
    const index = this.activeFilters.indexOf(filter);
    if (index >= 0) {
      this.activeFilters.splice(index, 1);
      if (filter.campo === 'precio') {
        this.filterPrecioValorCtrl.setValue('', { emitEvent: false });
      } else if (filter.campo === 'precioCompra' && filter.condicion === '=' && filter.valor === '0') {
        this.filterGananciaPresetCtrl.setValue('', { emitEvent: false });
      } else if (filter.campo === 'porcentaje_ganancia') {
        this.filterGananciaPresetCtrl.setValue('', { emitEvent: false });
        this.filterGananciaValorCtrl.setValue('', { emitEvent: false });
      } else if (filter.campo === 'fechaUltimaActualizacionPrecio') {
        this.filterFechaActPrecioPresetCtrl.setValue('', { emitEvent: false });
        this.filterFechaActPrecioCustomDateCtrl.setValue(null, { emitEvent: false });
        this.filterFechaActPrecioCustomCondCtrl.setValue('=', { emitEvent: false });
      } else if (filter.campo === 'totalVentas') {
        this.filterTotalVentasValorCtrl.setValue('', { emitEvent: false });
      } else if (filter.campo === 'fecha_ultima_venta') {
        this.filterFechaUltimaVentaPresetCtrl.setValue('', { emitEvent: false });
        this.filterFechaUltimaVentaCustomDateCtrl.setValue(null, { emitEvent: false });
        this.filterFechaUltimaVentaCustomCondCtrl.setValue('=', { emitEvent: false });
      } else if (filter.campo === 'fechaCreacion') {
        this.filterFechaCreacionPresetCtrl.setValue('', { emitEvent: false });
        this.filterFechaCreacionCustomDateCtrl.setValue(null, { emitEvent: false });
        this.filterFechaCreacionCustomCondCtrl.setValue('=', { emitEvent: false });
      }
      this.fetchProducts(true);
    }
  }

  clearAllFilters(): void {
    this.activeFilters = [];
    this.percentFromTotal = null;
    this.filterPrecioCondCtrl.setValue('=', { emitEvent: false });
    this.filterPrecioValorCtrl.setValue('', { emitEvent: false });
    this.filterGananciaPresetCtrl.setValue('', { emitEvent: false });
    this.filterGananciaCondCtrl.setValue('=', { emitEvent: false });
    this.filterGananciaValorCtrl.setValue('', { emitEvent: false });
    this.filterFechaActPrecioPresetCtrl.setValue('', { emitEvent: false });
    this.filterFechaActPrecioCustomCondCtrl.setValue('=', { emitEvent: false });
    this.filterFechaActPrecioCustomDateCtrl.setValue(null, { emitEvent: false });
    this.filterTotalVentasCondCtrl.setValue('=', { emitEvent: false });
    this.filterTotalVentasValorCtrl.setValue('', { emitEvent: false });
    this.filterFechaUltimaVentaPresetCtrl.setValue('', { emitEvent: false });
    this.filterFechaUltimaVentaCustomCondCtrl.setValue('=', { emitEvent: false });
    this.filterFechaUltimaVentaCustomDateCtrl.setValue(null, { emitEvent: false });
    this.filterFechaCreacionPresetCtrl.setValue('', { emitEvent: false });
    this.filterFechaCreacionCustomCondCtrl.setValue('=', { emitEvent: false });
    this.filterFechaCreacionCustomDateCtrl.setValue(null, { emitEvent: false });
    this.filterVerSoloActivosCtrl.setValue(false, { emitEvent: false });
    if (this.sort) {
      this.sort.active = '';
      this.sort.direction = '';
    }
    this.searchCtrl.setValue('', { emitEvent: false });
    this.fetchProducts(true);
  }

  private isNumericBarcode(value: string): boolean {
    // Check if the value is a numeric barcode (all digits, typically 8-13 digits)
    if (!value || value.trim() === '') return false;
    return /^\d{8,}$/.test(value.trim());
  }

  /**
   * Fetch products from API.
   * @param reset - If true, load page 0 and replace products. If false, load next page and append.
   * @param shouldAutoEdit - If true, auto-open edit when exactly 1 product found (used when user searches).
   */
  fetchProducts(reset: boolean = true, shouldAutoEdit: boolean = false) {
    const q = (this.searchCtrl.value || '').trim();
    if (reset) {
      this.pageIndex = 0;
      this.totalPages = 0;
      this.dataSource = [];
      this.loading = true;
      this.loadingMore = false;
    } else {
      if (this.loading || this.loadingMore) return;
      if (this.totalPages > 0 && this.pageIndex + 1 >= this.totalPages) return;
      this.loadingMore = true;
    }

    const pageToLoad = reset ? 0 : this.pageIndex + 1;

    // Check if filters or custom sorting are active
    const hasFilters = this.activeFilters.length > 0;
    const hasSearchQuery = q.length > 0;

    // Extract sorting rules from matSort
    const sortActiveField = this.sort?.active || 'nombre';
    const sortDirection = this.sort?.direction || 'asc';

    // Default check logic: sort is manually overridden if not 'nombre' ascending
    const hasCustomSorting = sortActiveField !== 'nombre' || sortDirection !== 'asc';

    // Usar busquedaPorFiltros cuando hay búsqueda, filtros del menú o ordenamiento personalizado
    const useBusquedaPorFiltros = hasSearchQuery || hasFilters || hasCustomSorting;

    let operation;

    if (useBusquedaPorFiltros) {
      // Mapear campo de ordenamiento al nombre que espera la API (fechas: orden por valor, no por descripción)
      const campoOrdenamientoApi = this.sortFieldToApiField[sortActiveField] ?? sortActiveField;
      const isDateSort = this.dateSortColumns.has(sortActiveField);

      // Construir filtros. Solo agregar activate si el usuario marcó "Ver únicamente productos activos".
      const filtros: { campo: string; condicion: string; valor: string }[] = [];
      if (this.filterVerSoloActivosCtrl.value) {
        filtros.push({ campo: 'activate', condicion: '=', valor: '1' });
      }
      filtros.push(...this.activeFilters.map(f => ({
        campo: this.filterCampoToApiField[f.campo] ?? f.campo,
        condicion: f.condicion,
        valor: f.valor
      })));

      const payload: any = {
        filtros,
        page: pageToLoad,
        size: this.pageSize,
        campoOrdenamiento: campoOrdenamientoApi,
        orden: sortDirection,
        ...(isDateSort && { tipoOrdenamiento: 'date' })  // Hint para backend: ordenar por valor de fecha
      };
      operation = this.relationalProductService.busquedaPorFiltros(payload, q);
    } else {
      operation = this.relationalProductService.getProducts(q, pageToLoad, this.pageSize);
    }

    operation
      .pipe(finalize(() => {
        this.loading = false;
        this.loadingMore = false;
      }))
      .subscribe({
        next: (result: any) => {
          // Soporte formato envuelto (page) o plano; busquedaPorFiltros se mapea en servicio
          const page = result.page ?? result;
          const content = page.content ?? [];
          this.totalPages = page.totalPages ?? 0;
          this.totalElements = page.totalElements ?? 0;
          this.pageIndex = pageToLoad;

          // percentFromTotal solo viene en busquedaPorFiltros
          this.percentFromTotal = result.percentFromTotal != null ? result.percentFromTotal : null;

          if (reset) {
            this.dataSource = content;
          } else {
            this.dataSource = this.dataSource.concat(content);
          }

          // Reconcile displayed columns with actual data and user requested columns
          this.updateDisplayedColumnsFromData(content);

          // Tras cargar más filas: forzar recálculo de layout para que los iconos no se recorten
          if (!reset) {
            setTimeout(() => this.cdr.markForCheck(), 0);
          }

          // Auto-open edit dialog only if:
          if (reset && shouldAutoEdit && !this.justClosedDialog && this.totalElements === 1 && content.length > 0) {
            this.editProduct(content[0]);
          }

          // Auto-open create product dialog only if:
          if (reset && this.totalElements === 0 && !this.justClosedDialog) {
            if (q && this.isNumericBarcode(q)) {
              this.createProduct(q);
            }
          }

          setTimeout(() => this.maybeLoadMoreIfNoScroll(), 50);
        },
        error: () => {
          if (reset) {
            this.dataSource = [];
          }
        }
      });
  }

  /**
   * After loading data, ensure columns requested by the user exist in the displayedColumns
   * if the product objects contain those fields. This helps when the template supports
   * the column but initial parsing did not include them for any reason.
   */
  private updateDisplayedColumnsFromData(content: any[]): void {
    if (!content || content.length === 0) return;
    const first = content[0];

    try {
      const raw = localStorage.getItem('configuraciones-personales');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const verTabla = parsed?.productos?.verTabla;
      if (!verTabla || typeof verTabla !== 'string') return;

      const requested = verTabla.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      const availableDefs = new Set<string>(['id','nombre','precio','precioUnidad','precioCompra','fechaUltimaActualizacionPrecio','fechaCreacion','totalVentas','porcentajeGanancia','fechaUltimaVenta','edit']);
      

      for (const req of requested) {
        // map logical to template name
        const mapping: Record<string,string> = { 'barcode':'id','precioUnidad':'precioUnidad','precioCompra':'precioCompra','fechaCreacion':'fechaCreacion','porcentaje_ganancia':'porcentajeGanancia','fecha_ultima_venta':'fechaUltimaVenta' };
        const col = mapping[req] || req;
        if (!availableDefs.has(col)) continue;
        if (this.displayedColumns.includes(col)) continue;
        // check if data actually contains the property
        if (col in first || (col === 'fechaCreacion' && ('fechaCreacion' in first))) {
          // insert before edit column if present
          const editIdx = this.displayedColumns.indexOf('edit');
          if (editIdx >= 0) {
            this.displayedColumns.splice(editIdx, 0, col);
          } else {
            this.displayedColumns.push(col);
          }
        }
      }

      this.cdr.markForCheck();
    } catch (e) {
      // ignore
    }
  }

  /**
   * Called when user scrolls in the products list. Loads next page when near bottom.
   */
  onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (!element) return;

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const remaining = scrollHeight - (scrollTop + clientHeight);

    if (remaining >= 80) return;
    if (this.loading || this.loadingMore) return;
    if (this.totalPages > 0 && this.pageIndex + 1 >= this.totalPages) return;

    this.fetchProducts(false);
  }

  abrirEscannerCodigoBarras(): void {
    const dialogRef = this.dialog.open(BarcodeScannerDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'barcode-scanner-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((codigo: string | undefined) => {
      const trimmed = codigo?.trim();
      if (trimmed) {
        this.justClosedDialog = false;
        this.searchCtrl.setValue(trimmed);
      }
      this.focusSearchInput();
    });
  }

  createProduct(barcode?: string) {
    // Only pass barcode if it has a value (trim and check)
    const trimmedBarcode = barcode?.trim();
    const dialogData = trimmedBarcode ? { barcode: trimmedBarcode } : null;
    const dialogRef = this.dialog.open(EditarProductoComponent, {
      width: '600px',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      // Set flag to prevent auto-edit after dialog closes
      this.justClosedDialog = true;
      if (result) {
        // Set searchCtrl to the barcode of the created product
        if (result.barcode) {
          this.searchCtrl.setValue(result.barcode);
        }
        this.fetchProducts(); // This won't auto-edit because justClosedDialog is true
      }
      // Always focus on search input when dialog closes (cancelled or saved)
      this.focusSearchInput();
    });
  }

  editProduct(product?: any) {
    const dialogRef = this.dialog.open(EditarProductoComponent, {
      width: '600px',
      data: product
    });
    dialogRef.afterClosed().subscribe(result => {
      // Set flag to prevent auto-edit after dialog closes
      this.justClosedDialog = true;
      if (result && result._edit) {
        this.fetchProducts(); // This won't auto-edit because justClosedDialog is true
      }
      // Always focus on search input when dialog closes (cancelled or saved)
      this.focusSearchInput();
    });
  }

  /**
   * Botón de enlace en fila: sin modo edición → solo productos sin grupo (abre modal).
   * Con modo edición activo → cualquier producto que aún no esté en el grupo actual (PUT vincular).
   */
  mostrarBotonGrupoEspejoEnFila(product: Producto): boolean {
    if (!product?.id) {
      return false;
    }
    if (this.grupoEspejoEdicion) {
      return !this.productoPerteneceAlGrupoEspejoActual(product);
    }
    return product.grupoEspejo == null;
  }

  /** Indica si el producto ya forma parte del grupo espejo en edición (API o lista del panel) */
  private productoPerteneceAlGrupoEspejoActual(product: Producto): boolean {
    const g = this.grupoEspejoEdicion;
    if (!g || !product.id) {
      return false;
    }
    if (product.grupoEspejo?.id === g.id) {
      return true;
    }
    return g.productos.some((p) => p.id === product.id);
  }

  ejecutarAccionGrupoEspejoEnFila(product: Producto): void {
    if (this.grupoEspejoEdicion) {
      const ids = this.obtenerIdsParaVincularGrupoEspejo(product);
      this.vincularProductosAlGrupoEspejoActual(ids);
    } else {
      this.abrirModalGrupoEspejo(product);
    }
  }

  /**
   * IDs de la selección actual en la tabla que aún no están en el grupo en edición.
   */
  private obtenerIdsSeleccionPendientesParaGrupo(): number[] {
    if (!this.grupoEspejoEdicion) {
      return [];
    }
    return [...this.selectedProductIds]
      .map((sid) => this.dataSource.find((p) => p.id === sid))
      .filter(
        (p): p is Producto =>
          !!p && !this.productoPerteneceAlGrupoEspejoActual(p)
      )
      .map((p) => p.id!);
  }

  /** Panel superior: hay selección con al menos un producto fuera del listado del grupo */
  mostrarBotonAgregarSeleccionAlGrupoEspejo(): boolean {
    return (
      !!this.grupoEspejoEdicion &&
      !this.grupoEspejoBusy &&
      this.obtenerIdsSeleccionPendientesParaGrupo().length >= 1
    );
  }

  /** Misma acción que el enlace en fila: vincular selección pendiente al grupo actual */
  agregarSeleccionAlGrupoEspejoDesdePanel(): void {
    const ids = this.obtenerIdsSeleccionPendientesParaGrupo();
    if (ids.length === 0) {
      return;
    }
    this.vincularProductosAlGrupoEspejoActual(ids);
  }

  /**
   * Con modo edición: si hay selección múltiple (Ctrl), vincula todos los seleccionables;
   * si no hay selección, usa solo la fila donde se pulsó el botón.
   */
  private obtenerIdsParaVincularGrupoEspejo(clicked: Producto): number[] {
    const seleccion = [...this.selectedProductIds]
      .map((sid) => this.dataSource.find((p) => p.id === sid))
      .filter(
        (p): p is Producto =>
          !!p && !this.productoPerteneceAlGrupoEspejoActual(p)
      );
    if (seleccion.length > 0) {
      return seleccion.map((p) => p.id!);
    }
    if (clicked?.id != null && !this.productoPerteneceAlGrupoEspejoActual(clicked)) {
      return [clicked.id];
    }
    return [];
  }

  /** Texto del tooltip del botón de enlace según selección */
  tooltipVincularGrupoEspejo(_product: Producto): string {
    if (!this.grupoEspejoEdicion) {
      return 'Agregar a grupo espejo';
    }
    const n = [...this.selectedProductIds].filter((id) => {
      const p = this.dataSource.find((x) => x.id === id);
      return !!p && !this.productoPerteneceAlGrupoEspejoActual(p);
    }).length;
    if (n > 1) {
      return `Vincular ${n} productos seleccionados a este grupo espejo (Ctrl+clic en filas)`;
    }
    return 'Vincular a este grupo espejo';
  }

  /** Sin modo edición: producto ya en un grupo → icono lápiz para abrir ese grupo */
  mostrarBotonEditarGrupoEspejoEnFila(product: Producto): boolean {
    return !this.grupoEspejoEdicion && !!product?.id && !!product.grupoEspejo;
  }

  /** Carga el grupo espejo del producto y activa el modo edición del panel */
  entrarModoEdicionGrupoDesdeProducto(product: Producto): void {
    const ref = product.grupoEspejo;
    if (!ref?.id) {
      return;
    }
    this.grupoEspejoBusy = true;
    const q = (ref.nombre ?? '').trim();
    this.grupoEspejoService
      .buscar(q)
      .pipe(
        switchMap((list) => {
          const found = list.find((x) => x.id === ref.id);
          if (found) {
            return of(found);
          }
          return this.grupoEspejoService.buscar('').pipe(
            map((list2) => list2.find((x) => x.id === ref.id))
          );
        }),
        finalize(() => {
          this.grupoEspejoBusy = false;
        })
      )
      .subscribe({
        next: (g) => {
          if (!g) {
            this.snackBar.open('No se encontró el grupo espejo.', 'Cerrar', {
              duration: 5000
            });
            return;
          }
          this.cancelarEdicionesPanelGrupoEspejo();
          this.activarModoGrupoEspejoEdicion(g);
        },
        error: () => {
          this.snackBar.open('No se pudo cargar el grupo espejo.', 'Cerrar', {
            duration: 5000
          });
        }
      });
  }

  trackByProductoPanelId(_: number, p: GrupoEspejoProductoPanel): number {
    return p.id;
  }

  /** Clave estable para comparar la tupla de precios entre productos del panel */
  private tuplaKeyPreciosGrupoEspejo(p: GrupoEspejoProductoPanel): string {
    const n = (v: number | null | undefined): string => {
      if (v == null || (typeof v === 'number' && Number.isNaN(v))) {
        return '∅';
      }
      return String(Math.round(Number(v) * 10000) / 10000);
    };
    return [n(p.precio), n(p.precioUnidad), n(p.precioCompra), n(p.porcentajeGanancia)].join('|');
  }

  /** Tupla más frecuente; empate → lexicográficamente mayor (precios más altos) */
  private tuplaReferenciaMayoritariaGrupoEspejo(): string | null {
    const prods = this.grupoEspejoEdicion?.productos ?? [];
    if (prods.length === 0) {
      return null;
    }
    const counts = new Map<string, number>();
    for (const p of prods) {
      const k = this.tuplaKeyPreciosGrupoEspejo(p);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    let bestKey = '';
    let bestCount = -1;
    for (const [k, c] of counts) {
      if (c > bestCount || (c === bestCount && k > bestKey)) {
        bestKey = k;
        bestCount = c;
      }
    }
    return bestKey || null;
  }

  /** Hay al menos dos productos con distinta tupla de precios */
  hayConflictoPreciosGrupoEspejo(): boolean {
    const prods = this.grupoEspejoEdicion?.productos ?? [];
    if (prods.length < 2) {
      return false;
    }
    return new Set(prods.map((x) => this.tuplaKeyPreciosGrupoEspejo(x))).size > 1;
  }

  /** Fila a resaltar: precios distintos al resto del grupo (referencia mayoritaria) */
  esProductoGrupoEspejoPrecioDesalineado(p: GrupoEspejoProductoPanel): boolean {
    if (!this.hayConflictoPreciosGrupoEspejo()) {
      return false;
    }
    const ref = this.tuplaReferenciaMayoritariaGrupoEspejo();
    return ref != null && this.tuplaKeyPreciosGrupoEspejo(p) !== ref;
  }

  private segmentoTuplaPrecioGrupoEspejo(
    v: number | null | undefined
  ): string {
    if (v == null || (typeof v === 'number' && Number.isNaN(v))) {
      return '∅';
    }
    return String(Math.round(Number(v) * 10000) / 10000);
  }

  private partesTuplaReferenciaGrupoEspejo(): [string, string, string, string] | null {
    const ref = this.tuplaReferenciaMayoritariaGrupoEspejo();
    if (!ref) {
      return null;
    }
    const parts = ref.split('|');
    if (parts.length !== 4) {
      return null;
    }
    return [parts[0], parts[1], parts[2], parts[3]];
  }

  /**
   * Indica si un campo concreto del producto difiere de la tupla de referencia del grupo
   * (solo cuando hay conflicto de precios).
   */
  campoPrecioGrupoEspejoDifiereReferencia(
    p: GrupoEspejoProductoPanel,
    campo: 'precio' | 'precioUnidad' | 'precioCompra' | 'porcentajeGanancia'
  ): boolean {
    if (!this.hayConflictoPreciosGrupoEspejo()) {
      return false;
    }
    const partes = this.partesTuplaReferenciaGrupoEspejo();
    if (!partes) {
      return false;
    }
    const idx =
      campo === 'precio'
        ? 0
        : campo === 'precioUnidad'
          ? 1
          : campo === 'precioCompra'
            ? 2
            : 3;
    const v =
      campo === 'precio'
        ? p.precio
        : campo === 'precioUnidad'
          ? p.precioUnidad
          : campo === 'precioCompra'
            ? p.precioCompra
            : p.porcentajeGanancia;
    return this.segmentoTuplaPrecioGrupoEspejo(v) !== partes[idx];
  }

  /** Para plantilla: valor numérico usable en number pipe */
  tieneValorNumericoPrecioPanel(v: number | null | undefined): boolean {
    return v != null && typeof v === 'number' && !Number.isNaN(v);
  }

  onPrecioPopoverTriggerEnter(trigger: MatMenuTrigger): void {
    this.clearPrecioPopoverCloseTimer();
    if (this.precioPopoverTrigger && this.precioPopoverTrigger !== trigger) {
      this.precioPopoverTrigger.closeMenu();
    }
    this.precioPopoverTrigger = trigger;
    trigger.openMenu();
  }

  onPrecioPopoverTriggerLeave(): void {
    this.schedulePrecioPopoverClose();
  }

  onPrecioPopoverPanelEnter(): void {
    this.clearPrecioPopoverCloseTimer();
  }

  onPrecioPopoverPanelLeave(): void {
    this.schedulePrecioPopoverClose();
  }

  private schedulePrecioPopoverClose(): void {
    this.clearPrecioPopoverCloseTimer();
    this.precioPopoverCloseTimer = setTimeout(() => {
      this.precioPopoverTrigger?.closeMenu();
      this.precioPopoverCloseTimer = null;
    }, 320);
  }

  private clearPrecioPopoverCloseTimer(): void {
    if (this.precioPopoverCloseTimer != null) {
      clearTimeout(this.precioPopoverCloseTimer);
      this.precioPopoverCloseTimer = null;
    }
  }

  /**
   * Orden para "Corregir precio": null/NaN, luego 0, luego positivos crecientes.
   */
  private precioOrdenCorreccionGrupoEspejo(p: GrupoEspejoProductoPanel): number {
    const x = p.precio;
    if (x == null || (typeof x === 'number' && Number.isNaN(x))) {
      return Number.NEGATIVE_INFINITY;
    }
    if (x === 0) {
      return -Number.MAX_VALUE / 2;
    }
    return x;
  }

  /** Producto con precio de venta más bajo (o nulo/cero) entre los del grupo */
  productoIdMenorPrecioParaCorregirGrupoEspejo(): number | null {
    const prods = this.grupoEspejoEdicion?.productos ?? [];
    if (prods.length === 0 || !this.hayConflictoPreciosGrupoEspejo()) {
      return null;
    }
    let best = prods[0];
    let bestOrd = this.precioOrdenCorreccionGrupoEspejo(best);
    for (let i = 1; i < prods.length; i++) {
      const q = prods[i];
      const o = this.precioOrdenCorreccionGrupoEspejo(q);
      if (o < bestOrd || (o === bestOrd && q.id < best.id)) {
        best = q;
        bestOrd = o;
      }
    }
    return best.id;
  }

  mostrarBotonCorregirPrecioGrupoEspejo(): boolean {
    return (
      !!this.grupoEspejoEdicion &&
      this.hayConflictoPreciosGrupoEspejo() &&
      !this.grupoEspejoBusy &&
      this.productoIdMenorPrecioParaCorregirGrupoEspejo() != null
    );
  }

  /** Abre editar-producto sobre el ítem con precio más bajo; al guardar, refresca panel y tabla */
  abrirCorregirPrecioGrupoEspejo(): void {
    const id = this.productoIdMenorPrecioParaCorregirGrupoEspejo();
    if (id == null) {
      return;
    }
    this.relationalProductService.getProductById(id).subscribe({
      next: (product) => {
        const dialogRef = this.dialog.open(EditarProductoComponent, {
          width: '600px',
          data: product
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.justClosedDialog = true;
          if (result?._edit && this.grupoEspejoEdicion) {
            const gid = this.grupoEspejoEdicion.id;
            const nom = this.grupoEspejoEdicion.nombre;
            this.refrescarPanelGrupoEspejoDesdeApi(gid, nom, (g) => {
              if (g && !this.hayConflictoPreciosGrupoEspejo()) {
                this.snackBar.open(
                  'Los precios fueron unificados en todos los productos del grupo.',
                  'Cerrar',
                  { duration: 5000 }
                );
              }
              this.fetchProducts(true, true);
              this.focusSearchInput();
            });
          } else {
            this.focusSearchInput();
          }
        });
      },
      error: () => {
        this.snackBar.open('No se pudo cargar el producto para editar.', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  /** Abre el diálogo editar-producto para un ítem del panel; al guardar, sincroniza grupo y tabla */
  abrirEditarProductoGrupoEspejo(p: GrupoEspejoProductoPanel): void {
    if (!p?.id || this.grupoEspejoBusy) {
      return;
    }
    this.cancelarEdicionNombreGrupoEspejo();
    this.relationalProductService.getProductById(p.id).subscribe({
      next: (product) => {
        const dialogRef = this.dialog.open(EditarProductoComponent, {
          width: '600px',
          data: product
        });
        dialogRef.afterClosed().subscribe((result) => {
          this.justClosedDialog = true;
          if (result?._edit && this.grupoEspejoEdicion) {
            const gid = this.grupoEspejoEdicion.id;
            const nom = this.grupoEspejoEdicion.nombre;
            this.refrescarPanelGrupoEspejoDesdeApi(gid, nom, () => {
              this.fetchProducts(true, true);
              this.focusSearchInput();
            });
          } else {
            this.focusSearchInput();
          }
        });
      },
      error: () => {
        this.snackBar.open('No se pudo cargar el producto para editar.', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  private static readonly GRUPO_ESPEJO_NOMBRE_MAX_VISIBLE = 32;

  /** Nombre en tarjeta grupo espejo: máx. 32 caracteres + … */
  nombreGrupoEspejoVisible(nombre: string | null | undefined): string {
    const n = (nombre ?? '').trim();
    if (n.length <= ListaProductosComponent.GRUPO_ESPEJO_NOMBRE_MAX_VISIBLE) {
      return n;
    }
    return (
      n.slice(0, ListaProductosComponent.GRUPO_ESPEJO_NOMBRE_MAX_VISIBLE) + '…'
    );
  }

  iniciarEdicionNombreGrupoEspejo(): void {
    if (!this.grupoEspejoEdicion) {
      return;
    }
    this.grupoEspejoNombreCtrl.setValue(this.grupoEspejoEdicion.nombre);
    this.grupoEspejoEditandoNombre = true;
  }

  cancelarEdicionNombreGrupoEspejo(): void {
    this.grupoEspejoEditandoNombre = false;
    this.grupoEspejoNombreCtrl.setValue('');
  }

  guardarNombreGrupoEspejo(): void {
    if (!this.grupoEspejoEdicion) {
      return;
    }
    const nombre = this.grupoEspejoNombreCtrl.value?.trim();
    if (!nombre) {
      this.snackBar.open('El nombre no puede estar vacío.', 'Cerrar', {
        duration: 4000
      });
      return;
    }
    if (nombre === this.grupoEspejoEdicion.nombre) {
      this.cancelarEdicionNombreGrupoEspejo();
      return;
    }
    const gid = this.grupoEspejoEdicion.id;
    this.grupoEspejoGuardandoNombre = true;
    this.grupoEspejoService
      .actualizarGrupo(gid, { nombre })
      .pipe(
        finalize(() => {
          this.grupoEspejoGuardandoNombre = false;
        })
      )
      .subscribe({
        next: (dto) => {
          if (this.grupoEspejoEdicion) {
            this.grupoEspejoEdicion = {
              ...this.grupoEspejoEdicion,
              nombre: dto.nombre
            };
          }
          this.grupoEspejoEditandoNombre = false;
          this.snackBar.open('Nombre del grupo espejo actualizado.', 'Cerrar', {
            duration: 4000
          });
          this.fetchProducts(true, true);
          this.refrescarPanelGrupoEspejoDesdeApi(dto.id, dto.nombre);
        },
        error: (err: HttpErrorResponse) => {
          const msg =
            (err.error && typeof err.error === 'object' && 'message' in err.error
              ? (err.error as { message?: string }).message
              : null) ||
            (typeof err.error === 'string' ? err.error : null) ||
            'No se pudo actualizar el nombre del grupo espejo.';
          this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
        }
      });
  }

  /**
   * Muestra el recuadro "Precio homogéneo" cuando todos los ítems comparten la misma tupla de precios
   * (incl. un solo producto). Si hay conflicto, no se muestra (se usa "Corregir precio" / desglose por fila).
   */
  mostrarBloquePrecioHomogeneoGrupoEspejo(): boolean {
    const g = this.grupoEspejoEdicion;
    return !!g && g.productos.length >= 1 && !this.hayConflictoPreciosGrupoEspejo();
  }

  /** Precio de venta del primer ítem (todos iguales cuando el bloque es visible) */
  precioHomogeneoVentaGrupoEspejo(): number | null {
    const p0 = this.grupoEspejoEdicion?.productos?.[0];
    return p0 && this.tieneValorNumericoPrecioPanel(p0.precio) ? p0.precio! : null;
  }

  /**
   * Abre editar-producto con un ítem representativo (el primero del grupo).
   * Cualquier producto sirve para ajustar el precio; el backend unifica el grupo.
   */
  abrirEditarPrecioHomogeneoGrupoEspejo(): void {
    const p0 = this.grupoEspejoEdicion?.productos?.[0];
    if (!p0) {
      return;
    }
    this.abrirEditarProductoGrupoEspejo(p0);
  }

  private cancelarEdicionesPanelGrupoEspejo(): void {
    this.grupoEspejoEditandoNombre = false;
    this.grupoEspejoNombreCtrl.setValue('');
    this.grupoEspejoGuardandoNombre = false;
  }

  /**
   * Asocia uno o varios productos al grupo espejo en edición (llamadas secuenciales).
   */
  private vincularProductosAlGrupoEspejoActual(rawIds: number[]): void {
    if (!this.grupoEspejoEdicion || rawIds.length === 0) {
      return;
    }
    const grupoId = this.grupoEspejoEdicion.id;
    const nombreRef = this.grupoEspejoEdicion.nombre;
    const unique = [...new Set(rawIds)];
    const productos = unique
      .map((pid) => this.dataSource.find((p) => p.id === pid))
      .filter(
        (p): p is Producto =>
          !!p && !this.productoPerteneceAlGrupoEspejoActual(p)
      );
    if (productos.length === 0) {
      this.snackBar.open(
        'Ningún producto aplicable: ya están en este grupo o no hay datos.',
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }
    const ids = productos.map((p) => p.id!);
    this.grupoEspejoBusy = true;
    let ok = 0;
    let fail = 0;
    from(ids)
      .pipe(
        concatMap((pid) =>
          this.grupoEspejoService.agregarProducto(grupoId, pid).pipe(
            tap(() => ok++),
            catchError(() => {
              fail++;
              return EMPTY;
            })
          )
        ),
        finalize(() => {
          this.grupoEspejoBusy = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        complete: () => {
          if (ok > 0) {
            this.snackBar.open(
              ok === 1
                ? 'Producto agregado al grupo espejo.'
                : `${ok} productos agregados al grupo espejo.`,
              'Cerrar',
              { duration: 4000 }
            );
            this.fetchProducts(true, true);
            this.refrescarPanelGrupoEspejoDesdeApi(grupoId, nombreRef);
            this.selectedProductIds.clear();
          }
          if (fail > 0) {
            this.snackBar.open(
              fail === 1
                ? 'No se pudo vincular 1 producto (p. ej. ya pertenece a otro grupo).'
                : `No se pudieron vincular ${fail} productos.`,
              'Cerrar',
              { duration: 6000 }
            );
          }
        }
      });
  }

  abrirModalGrupoEspejo(product: Producto): void {
    if (!product?.id) {
      return;
    }
    this.abrirModalGrupoEspejoConData({
      producto: product,
      productoIdsSeleccionados: [product.id]
    });
  }

  /**
   * Barra superior: crear / asociar grupo espejo con la selección actual (1 o varios con Ctrl+clic).
   */
  abrirModalGrupoEspejoDesdeBarraSeleccion(): void {
    if (this.grupoEspejoEdicion) {
      return;
    }
    const ids = [...this.selectedProductIds];
    const productos = ids
      .map((id) => this.dataSource.find((p) => p.id === id))
      .filter((p): p is Producto => !!p);
    const sinGrupo = productos.filter((p) => !p.grupoEspejo);
    if (sinGrupo.length === 0) {
      this.snackBar.open(
        'Los productos seleccionados ya pertenecen a un grupo espejo. Elija otros o quite la selección.',
        'Cerrar',
        { duration: 6000 }
      );
      return;
    }
    if (sinGrupo.length < productos.length) {
      this.snackBar.open(
        'Solo se incluyen productos sin grupo espejo; el resto se omitió.',
        'Cerrar',
        { duration: 5000 }
      );
    }
    const anchor = sinGrupo[0];
    this.abrirModalGrupoEspejoConData({
      producto: anchor,
      productoIdsSeleccionados: sinGrupo.map((p) => p.id!)
    });
  }

  /** Visible con ≥1 fila seleccionada y sin modo edición de grupo activo en el panel. */
  mostrarBotonCrearGrupoEspejoBarraSuperior(): boolean {
    return this.selectedProductIds.size >= 1 && !this.grupoEspejoEdicion;
  }

  private abrirModalGrupoEspejoConData(
    data: SeleccionarCrearGrupoEspejoDialogData
  ): void {
    const dialogRef = this.dialog.open(SeleccionarCrearGrupoEspejoComponent, {
      width: '720px',
      maxWidth: '95vw',
      data
    });
    dialogRef.afterClosed().subscribe((result: SeleccionarCrearGrupoEspejoDialogResult | undefined) => {
      this.justClosedDialog = true;
      if (result?.grupo) {
        this.activarModoGrupoEspejoEdicion(result.grupo);
      }
      this.fetchProducts(true, true);
      this.focusSearchInput();
    });
  }

  private mapProductosPanelDesdeDto(grupo: GrupoEspejoDto): GrupoEspejoProductoPanel[] {
    return (grupo.productos ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio ?? null,
      precioUnidad: p.precioUnidad ?? null,
      precioCompra: p.precioCompra ?? null,
      porcentajeGanancia: p.porcentajeGanancia ?? null
    }));
  }

  private activarModoGrupoEspejoEdicion(grupo: GrupoEspejoDto): void {
    this.grupoEspejoEdicion = {
      id: grupo.id,
      nombre: grupo.nombre,
      productos: this.mapProductosPanelDesdeDto(grupo)
    };
    this.refrescarPanelGrupoEspejoDesdeApi(grupo.id, grupo.nombre);
  }

  /**
   * Actualiza el panel desde GET /grupos-espejo?query=...
   * Importante: si solo se busca por nombre, el grupo recién creado o con nombre que no matchea
   * la query puede no aparecer → antes se llamaba salirModoGrupoEspejoEdicion() y el panel parpadeaba.
   * Se usa el mismo fallback que entrarModoEdicionGrupoDesdeProducto: buscar('') y localizar por id.
   * Nunca cerramos el modo aquí por “no encontrado” o lista vacía: se mantiene el estado ya cargado.
   */
  private refrescarPanelGrupoEspejoDesdeApi(
    grupoId: number,
    nombreHint: string,
    afterUpdated?: (grupo: GrupoEspejoDto | null) => void
  ): void {
    const q = (nombreHint ?? '').trim();
    this.grupoEspejoService
      .buscar(q)
      .pipe(
        switchMap((list) => {
          const found = list.find((x) => x.id === grupoId);
          if (found) {
            return of(found);
          }
          return this.grupoEspejoService.buscar('').pipe(
            map((list2) => list2.find((x) => x.id === grupoId) ?? null)
          );
        })
      )
      .subscribe({
        next: (g) => {
          if (!g) {
            this.snackBar.open(
              'No se pudo sincronizar el grupo espejo con el servidor. El panel muestra el último estado conocido.',
              'Cerrar',
              { duration: 6000 }
            );
            this.cdr.markForCheck();
            afterUpdated?.(null);
            return;
          }
          const productos = this.mapProductosPanelDesdeDto(g);
          this.grupoEspejoEdicion = {
            id: g.id,
            nombre: g.nombre,
            productos
          };
          this.cdr.markForCheck();
          afterUpdated?.(g);
        },
        error: () => {
          this.snackBar.open('No se pudo actualizar el grupo espejo.', 'Cerrar', {
            duration: 5000
          });
          this.cdr.markForCheck();
          afterUpdated?.(null);
        }
      });
  }

  quitarProductoDeGrupoEspejo(item: GrupoEspejoProductoPanel): void {
    if (!this.grupoEspejoEdicion) {
      return;
    }
    const grupoId = this.grupoEspejoEdicion.id;
    const nombreRef = this.grupoEspejoEdicion.nombre;
    this.grupoEspejoBusy = true;
    this.grupoEspejoService
      .quitarProducto(grupoId, item.id)
      .pipe(
        finalize(() => {
          this.grupoEspejoBusy = false;
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Producto quitado del grupo espejo.', 'Cerrar', {
            duration: 4000
          });
          this.fetchProducts(true, true);
          this.refrescarPanelGrupoEspejoDesdeApi(grupoId, nombreRef);
        },
        error: (err: HttpErrorResponse) => {
          let msg = 'No se pudo quitar el producto del grupo espejo.';
          if (err.status === 404) {
            msg =
              'El grupo espejo no existe o el producto no pertenece a ese grupo.';
          } else if (err.error && typeof err.error === 'object' && 'message' in err.error) {
            const m = (err.error as { message?: string }).message;
            if (m) msg = m;
          } else if (typeof err.error === 'string' && err.error.length > 0) {
            msg = err.error;
          }
          this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
        }
      });
  }

  salirModoGrupoEspejoEdicion(): void {
    this.cancelarEdicionesPanelGrupoEspejo();
    this.grupoEspejoEdicion = null;
    this.selectedProductIds.clear();
    this.cdr.markForCheck();
  }

  private focusSearchInput() {
    const el = this.searchInput?.nativeElement;
    if (!el) {
      return;
    }
    setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
      if (this.searchCtrl.value) {
        el.select();
      }
    }, 100);
  }

  /**
   * Formatea una fecha para mostrar en tabla (relativa a hoy: Hoy, Ayer, día semana, o fecha + descripción)
   */
  getFechaRelativa(dateValue: Date | string | null | undefined): FechaRelativaTableResult | null {
    return this.fechaUtilService.formatDateRelativeTable(dateValue);
  }

  /**
   * Muestra el icono copiar al pasar el mouse sobre un código de barras
   */
  onBarcodeCellHover(rowIndex: number): void {
    this.hoveredBarcodeRowIndex = rowIndex;
    this.cdr.markForCheck();
  }

  /**
   * Oculta el icono y resetea estado al salir del código de barras
   */
  onBarcodeCellLeave(): void {
    this.hoveredBarcodeRowIndex = null;
    this.copiedBarcodeRowIndex = null;
    this.cdr.markForCheck();
  }

  /**
   * Indica si debe mostrarse el icono copiar (hover y no acaba de copiar)
   */
  showBarcodeCopyIcon(rowIndex: number): boolean {
    return this.hoveredBarcodeRowIndex === rowIndex && this.copiedBarcodeRowIndex !== rowIndex;
  }

  /**
   * Copia el código de barras al portapapeles y oculta el icono
   */
  copyBarcodeToClipboard(barcode: string, rowIndex: number): void {
    const text = barcode ?? '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedBarcodeRowIndex = rowIndex;
      this.cdr.markForCheck();
    }).catch(() => {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copiedBarcodeRowIndex = rowIndex;
      this.cdr.markForCheck();
    });
  }

  /**
   * Check if a product is active
   */
  isProductActive(product: Producto): boolean {
    return product.activate === 1 || product.activate === undefined;
  }

  /**
   * Toggle product activation/deactivation
   */
  toggleProductActivation(product: Producto) {
    const productId = product.id;
    if (!productId) {
      return;
    }

    const isCurrentlyActive = this.isProductActive(product);
    const shouldActivate = !isCurrentlyActive;

    // Si se va a deshabilitar, mostrar diálogo de confirmación
    if (!shouldActivate) {
      const dialogData: ConfirmDialogData = {
        titulo: 'Confirmar deshabilitación',
        mensaje: `¿Estás seguro de que deseas deshabilitar el producto ${product.nombre}?`
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: dialogData
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.executeActivationChange(product, productId, shouldActivate);
        }
      });
    } else {
      // Si se va a activar, ejecutar directamente sin confirmación
      this.executeActivationChange(product, productId, shouldActivate);
    }
  }

  /**
   * Execute the activation/deactivation service call
   */
  private executeActivationChange(product: Producto, productId: number, shouldActivate: boolean) {
    this.loading = true;

    const operation = shouldActivate
      ? this.relationalProductService.activateProduct(productId)
      : this.relationalProductService.deactivateProduct(productId);

    operation
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: (updatedProduct) => {
          // Refresh the product list to update the search
          this.fetchProducts();
        },
        error: (err) => {
          alert('Error al ' + (shouldActivate ? 'activar' : 'desactivar') + ' el producto: ' + (err?.error?.message || err.message || err));
        }
      });
  }

  /**
   * Handle Google search button click events
   */
  onGoogleSearchClicked(event: { type: 'name' | 'barcode'; query: string }): void {
    // Este método se puede usar para tracking o logging si es necesario
    console.log(`Búsqueda en Google desde product-list: ${event.type} - ${event.query}`);
  }

  /**
   * Búsqueda Google por código de barras (equivalente a vex-google-search-button searchType="barcode").
   */
  searchProductByBarcodeInGoogle(product: Producto): void {
    const barcodeLimpio = (product?.barcode || '').trim();
    if (!barcodeLimpio) {
      return;
    }

    const esCodigoValido = /^\d{8,13}$/.test(barcodeLimpio);
    if (!esCodigoValido) {
      this.snackBar.open('El código de barras no tiene un formato válido', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'right',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const query = `${barcodeLimpio} PRECIO medellin`;
    this.onGoogleSearchClicked({ type: 'barcode', query });
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  }

  /**
   * Save product name edit
   */
  saveProductNameEdit(index: number, focusSearch: boolean = false): void {
    if (this.editingProductNameIndex !== index || index < 0 || index >= this.dataSource.length) {
      this.cancelProductNameEdit();
      return;
    }

    const product = this.dataSource[index];
    if (!product.id) {
      this.cancelProductNameEdit();
      return;
    }

    const inputElement = document.querySelector(`.product-name-input-${index}`) as HTMLInputElement;
    const newNombre = (inputElement?.value?.trim() || this.editingProductNameCtrl.value?.trim() || '').trim();

    if (!newNombre || newNombre.length === 0) {
      this.cancelProductNameEdit();
      return;
    }

    if (newNombre === product.nombre) {
      this.cancelProductNameEdit();
      return;
    }

    // Clear editing state immediately
    this.editingProductNameIndex = -1;
    this.editingProductNameCtrl.setValue('');

    // Update product via RelationalProductService
    const productUpdate: Producto = {
      ...product,
      nombre: newNombre,
      foto: product.foto ?? ''
    };

    this.relationalProductService.updateProduct(product.id, productUpdate).subscribe({
      next: (updatedProduct) => {
        // Update the product in the dataSource
        const updatedList = [...this.dataSource];
        updatedList[index] = {
          ...product,
          ...updatedProduct,
          nombre: updatedProduct.nombre
        };
        this.dataSource = updatedList;

        if (focusSearch) {
          this.focusSearchInput();
        }
      },
      error: (err: unknown) => {
        console.error('Error updating product name', err);
        // Revert the change on error
        const revertedList = [...this.dataSource];
        revertedList[index] = product;
        this.dataSource = revertedList;
      }
    });
  }

  /**
   * Cancel product name edit
   */
  cancelProductNameEdit(): void {
    this.editingProductNameIndex = -1;
    this.editingProductNameCtrl.setValue('');
  }

  /**
   * Save product price edit
   */
  saveProductPriceEdit(index: number, focusSearch: boolean = false): void {
    if (this.editingProductPriceIndex !== index || index < 0 || index >= this.dataSource.length) {
      this.cancelProductPriceEdit();
      return;
    }

    const product = this.dataSource[index];
    if (!product.id) {
      this.cancelProductPriceEdit();
      return;
    }

    const inputElement = document.querySelector(`.product-price-input-${index}`) as HTMLInputElement;
    const newPrecioStr = inputElement?.value?.trim() || this.editingProductPriceCtrl.value?.trim() || '';
    const newPrecio = Number(newPrecioStr);

    if (isNaN(newPrecio) || newPrecio < 0) {
      this.cancelProductPriceEdit();
      return;
    }

    if (newPrecio === product.precio) {
      this.cancelProductPriceEdit();
      return;
    }

    // Clear editing state immediately
    this.editingProductPriceIndex = -1;
    this.editingProductPriceCtrl.setValue('');

    // Update product via RelationalProductService
    const productUpdate: Producto = {
      ...product,
      precio: newPrecio,
      foto: product.foto ?? ''
    };

    this.relationalProductService.updateProduct(product.id, productUpdate).subscribe({
      next: (updatedProduct) => {
        // Update the product in the dataSource
        const updatedList = [...this.dataSource];
        updatedList[index] = {
          ...product,
          ...updatedProduct,
          precio: updatedProduct.precio
        };
        this.dataSource = updatedList;

        if (focusSearch) {
          this.focusSearchInput();
        }
      },
      error: (err: unknown) => {
        console.error('Error updating product price', err);
        // Revert the change on error
        const revertedList = [...this.dataSource];
        revertedList[index] = product;
        this.dataSource = revertedList;
      }
    });
  }

  /**
   * Cancel product price edit
   */
  cancelProductPriceEdit(): void {
    this.editingProductPriceIndex = -1;
    this.editingProductPriceCtrl.setValue('');
  }

  /**
   * Handle double click on product name
   */
  onProductNameDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (index < 0 || index >= this.dataSource.length) {
      return;
    }
    const product = this.dataSource[index];
    if (!product.id || !product.nombre) {
      return;
    }

    // Activar bandera de doble click
    this.isDoubleClickActive = true;
    this.startingEdit = true;

    this.editingProductNameIndex = index;
    this.editingProductNameCtrl.setValue(product.nombre);

    setTimeout(() => {
      const input = document.querySelector(`.product-name-input-${index}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      setTimeout(() => {
        this.startingEdit = false;
        // Desactivar bandera después de un tiempo
        setTimeout(() => {
          this.isDoubleClickActive = false;
        }, 200);
      }, 50);
    }, 0);
  }

  /**
   * Handle double click on product price
   */
  onProductPriceDoubleClick(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (index < 0 || index >= this.dataSource.length) {
      return;
    }
    const product = this.dataSource[index];
    if (!product.id) {
      return;
    }

    // Activar bandera de doble click
    this.isDoubleClickActive = true;
    this.startingEdit = true;

    this.editingProductPriceIndex = index;
    this.editingProductPriceCtrl.setValue(String(product.precio || 0));

    setTimeout(() => {
      const input = document.querySelector(`.product-price-input-${index}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
      setTimeout(() => {
        this.startingEdit = false;
        // Desactivar bandera después de un tiempo
        setTimeout(() => {
          this.isDoubleClickActive = false;
        }, 200);
      }, 50);
    }, 0);
  }

  /**
   * Handle keydown events for product name input
   */
  onProductNameInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      setTimeout(() => {
        this.saveProductNameEdit(index, true);
      }, 0);
    } else if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      this.cancelProductNameEdit();
    }
  }

  /**
   * Handle keydown events for product price input
   */
  onProductPriceInputKeydown(event: Event, index: number): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === 'NumpadEnter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      setTimeout(() => {
        this.saveProductPriceEdit(index, true);
      }, 0);
    } else if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      this.cancelProductPriceEdit();
    }
  }

  /**
   * Handle blur events for product name input
   */
  onProductNameInputBlur(index: number): void {
    setTimeout(() => {
      if (this.editingProductNameIndex === index) {
        this.saveProductNameEdit(index);
      }
    }, 150);
  }

  /**
   * Handle blur events for product price input
   */
  onProductPriceInputBlur(index: number): void {
    setTimeout(() => {
      if (this.editingProductPriceIndex === index) {
        this.saveProductPriceEdit(index);
      }
    }, 150);
  }

  /**
   * Al abrir el menú de columnas, restaura el estado de selección desde displayedColumns
   */
  onColumnVisibilityMenuOpened(): void {
    for (const col of this.allTableColumns) {
      const def = this.getColumnDefFromKey(col.key);
      this.columnVisibilitySelection[col.key] = this.displayedColumns.includes(def);
    }
    this.cdr.markForCheck();
  }

  /** Indica si una columna está seleccionada en el menú */
  isColumnSelected(key: string): boolean {
    return !!this.columnVisibilitySelection[key];
  }

  /** Alterna la visibilidad de una columna en el menú */
  toggleColumnVisibility(key: string): void {
    this.columnVisibilitySelection[key] = !this.columnVisibilitySelection[key];
    this.cdr.markForCheck();
  }

  /**
   * Aplica la configuración de columnas: actualiza tabla, localStorage y API
   */
  applyColumnVisibility(): void {
    let selectedKeys = this.allTableColumns
      .filter(c => this.columnVisibilitySelection[c.key])
      .map(c => c.key);
    // Mínimo: al menos barcode y nombre visibles
    const minCols = ['barcode', 'nombre'];
    const finalKeys = [...new Set([...minCols, ...selectedKeys])];
    const orderedKeys = this.allTableColumns
      .filter(c => finalKeys.includes(c.key))
      .map(c => c.key);
    const verTablaStr = orderedKeys.join(',');

    // Construir displayedColumns en el orden de la tabla (id, nombre, precio, ...)
    const newDisplayed: string[] = [];
    for (const col of this.allTableColumns) {
      if (!orderedKeys.includes(col.key)) continue;
      newDisplayed.push(this.getColumnDefFromKey(col.key));
    }
    newDisplayed.push('edit');

    this.displayedColumns = newDisplayed;
    this.cdr.markForCheck();

    // Cerrar menú inmediatamente tras aplicar
    this.columnVisibilityMenuTrigger?.closeMenu();

    // Actualizar localStorage y preparar payload para API
    let personalizacion: Record<string, unknown>;
    try {
      const raw = localStorage.getItem('configuraciones-personales');
      const current = raw ? JSON.parse(raw) : {};
      personalizacion = {
        ...current,
        productos: { ...(current.productos || {}), verTabla: verTablaStr }
      };
      localStorage.setItem('configuraciones-personales', JSON.stringify(personalizacion));
    } catch (e) {
      console.warn('Error al actualizar localStorage:', e);
      personalizacion = { productos: { verTabla: verTablaStr } };
    }

    // Llamar API
    this.savingColumnConfig = true;
    this.usuarioPerfilService.updatePersonalizacion(personalizacion).pipe(
      finalize(() => {
        this.savingColumnConfig = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {},
      error: (err: unknown) => {
        console.error('Error al guardar configuración de columnas:', err);
        alert('No se pudo guardar la configuración en el servidor. Los cambios se aplicaron localmente.');
      }
    });
  }

}
