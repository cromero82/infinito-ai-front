import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { RelationalProductService } from '../service/relational-product.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgFor, NgIf, DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { Producto, ProductPage } from '../model/producto';
import { finalize } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { UntypedFormControl, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as RecordRTC from 'recordrtc';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ProductEditComponent } from '../product-edit/product-edit.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import { ConfigurationService } from '../../../pages/auth/service/configuration.service';
import { GoogleSearchButtonComponent } from '../../../../@vex/components/google-search-button';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface FilterCondition {
  campo: string;
  condicion: string;
  valor: any;
  label?: string; // Solo para mostrar en la interfaz
}


@Component({
  selector: 'vex-product-list',
  standalone: true,
  imports: [
    VexPageLayoutComponent,
    VexPageLayoutHeaderDirective,
    VexPageLayoutContentDirective,
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
    DatePipe,
    CommonModule,
    GoogleSearchButtonComponent,
    MatSelectModule,
    MatMenuModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'id', 'nombre', 'precio', 'fechaUltimaActualizacionPrecio', 'totalVentas', 'edit'
  ];
  dataSource: any[] = [];
  totalElements = 0;
  loading = false;
  loadingMore = false;
  totalPages = 0;
  pageSize = 20;
  pageIndex = 0;
  searchCtrl = new UntypedFormControl('');
  private justClosedDialog = false; // Flag to prevent auto-edit after dialog closes
  selectedProductId: number | null = null; // Track selected product ID

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

  presetFilterCtrl = new FormControl<string>('');
  presetCustomDateCondCtrl = new FormControl<string>('=', { nonNullable: true });
  presetCustomDateCtrl = new FormControl<Date | null>(null);

  advFilterFieldCtrl = new FormControl<string>('');
  advFilterCondCtrl = new FormControl<string>('');
  advFilterValueCtrl = new FormControl<string>('');


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  // Reference to the trigger button so we can close the menu programmatically
  @ViewChild('filtersMenuTrigger') filtersMenuTrigger!: MatMenuTrigger;


  recording = false;
  private recorder: any = null;
  private stream: MediaStream | null = null;

  constructor(
    private relationalProductService: RelationalProductService,
    private http: HttpClient,
    private dialog: MatDialog,
    private configurationService: ConfigurationService,
    private cdr: ChangeDetectorRef
  ) { }

  minHeightPanelProductosValue = 420;

  ngOnInit() {
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
        'precioCompra',
        'fechaUltimaActualizacionPrecio',
        'fechaCreacion',
        'totalVentas',
        'edit'
      ]);

      // Map common logical names to actual column defs in the template
      const aliasMap: Record<string, string> = {
        'barcode': 'id',
        'id': 'id',
        'nombre': 'nombre',
        'precio': 'precio',
        'fechaUltimaActualizacionPrecio': 'fechaUltimaActualizacionPrecio',
        'fechaCreacion': 'fechaCreacion',
        'totalVentas': 'totalVentas',
        'precioCompra': 'precioCompra'
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
    // Focus on search input when component loads
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
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

    // Only handle "-" key if a product is selected and not typing in an input
    if (isMinusKey && this.selectedProductId !== null) {
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
   * Handle row click to select/deselect product
   */
  onRowClick(product: Producto) {
    // Verificar si el clic fue en un input de edición activo
    const target = event?.target as HTMLElement;
    if (target && (target.classList.contains('product-name-input') ||
      target.classList.contains('product-price-input'))) {
      // No hacer nada si el clic fue en inputs de edición activos
      return;
    }

    // Prevenir selección si estamos en modo de edición o iniciando edición
    if (this.startingEdit ||
      this.editingProductNameIndex !== -1 ||
      this.editingProductPriceIndex !== -1 ||
      this.isDoubleClickActive) {
      return;
    }

    if (this.selectedProductId === product.id) {
      // Deselect if clicking the same row
      this.selectedProductId = null;
    } else {
      // Select new row
      this.selectedProductId = product.id || null;
    }
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
    return this.selectedProductId === product.id;
  }

  /**
   * Delete the selected product
   */
  deleteSelectedProduct() {
    if (this.selectedProductId === null) {
      return;
    }

    const productId = this.selectedProductId;
    if (confirm(`¿Está seguro de que desea eliminar el producto con ID ${productId}?`)) {
      this.loading = true;
      this.relationalProductService.deleteProduct(productId)
        .pipe(finalize(() => {
          this.loading = false;
          this.selectedProductId = null; // Clear selection after deletion
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

  applyPresetFilter(): void {
    const preset = this.presetFilterCtrl.value;
    if (!preset) return;

    let condition: FilterCondition | null = null;
    const today = new Date();

    if (preset === 'nunca') {
      condition = { campo: 'fechaUltimaActualizacionPrecio', condicion: '=', valor: 'null', label: 'C. Precio: Nunca' };
    } else if (preset === 'mas_2_meses') {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 2);
      condition = { campo: 'fechaUltimaActualizacionPrecio', condicion: '<=', valor: this.formatDate(d), label: '> 2 meses sin act.' };
    } else if (preset === 'mas_4_meses') {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 4);
      condition = { campo: 'fechaUltimaActualizacionPrecio', condicion: '<=', valor: this.formatDate(d), label: '> 4 meses sin act.' };
    } else if (preset === 'menos_2_meses') {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 2);
      condition = { campo: 'fechaUltimaActualizacionPrecio', condicion: '>', valor: this.formatDate(d), label: '< 2 meses act.' };
    } else if (preset === ' personal date no effect text needed here if this is ignored...') {
      // Unreachable empty line placeholder
    } else if (preset === 'personalizado') {
      const customDate = this.presetCustomDateCtrl.value;
      const customCond = this.presetCustomDateCondCtrl.value;
      if (customDate && customCond) {
        condition = {
          campo: 'fechaUltimaActualizacionPrecio',
          condicion: customCond,
          valor: this.formatDate(customDate),
          label: `Act. ${customCond} ${this.formatDate(customDate)}`
        };
      }
    }

    if (condition) {
      this.activeFilters = this.activeFilters.filter(f => f.campo !== 'fechaUltimaActualizacionPrecio');
      this.activeFilters.push(condition);
      // DO NOT CLEAR presetFilterCtrl here - keep it selected for "edit mode" appearance
      // this.presetFilterCtrl.setValue('', { emitEvent: false });
      this.fetchProducts(true);
    }
  }

  applyAdvancedFilter(): void {
    const campo = this.advFilterFieldCtrl.value;
    const cond = this.advFilterCondCtrl.value;
    const valor = this.advFilterValueCtrl.value;

    if (campo && cond && valor) {
      const label = `${campo} ${cond} ${valor}`;
      this.activeFilters.push({ campo, condicion: cond, valor, label });
      this.advFilterFieldCtrl.setValue('', { emitEvent: false });
      this.advFilterCondCtrl.setValue('', { emitEvent: false });
      this.advFilterValueCtrl.setValue('', { emitEvent: false });
      this.fetchProducts(true);
    }
  }

  /**
   * Detect if there's an active date filter (fechaUltimaActualizacionPrecio)
   * and return its preset value
   */
  private getActivePresetFilterValue(): string | null {
    const dateFilter = this.activeFilters.find(f => f.campo === 'fechaUltimaActualizacionPrecio');
    if (!dateFilter) return null;

    // Map known labels back to preset values so the select can reflect the choice.
    if (dateFilter.valor === 'null') {
      return 'nunca';
    }

    switch (dateFilter.label) {
      case '> 2 meses sin act.':
        return 'mas_2_meses';
      case '> 4 meses sin act.':
        return 'mas_4_meses';
      case '< 2 meses act.':
        return 'menos_2_meses';
    }

    // Custom filter (label starts with "Act.")
    if (dateFilter.label?.startsWith('Act.')) {
      // parse condition and date from the label to repopulate the controls
      const parts = dateFilter.label.split(' ');
      if (parts.length >= 3) {
        const cond = parts[1];
        const dateStr = parts[2];
        this.presetCustomDateCondCtrl.setValue(cond, { emitEvent: false });
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          this.presetCustomDateCtrl.setValue(parsed, { emitEvent: false });
        }
      }
      return 'personalizado';
    }

    // fallback
    return null;
  }

  /**
   * Check if there's an active date filter
   */
  hasActiveDateFilter(): boolean {
    return this.activeFilters.some(f => f.campo === 'fechaUltimaActualizacionPrecio');
  }

  /**
   * Restore the preset filter control state based on active filters
   * This is called when the menu opens
   */
  restorePresetFilterState(): void {
    const activePresetValue = this.getActivePresetFilterValue();
    if (activePresetValue !== null) {
      this.presetFilterCtrl.setValue(activePresetValue, { emitEvent: false });
      // for custom filter we also want to populate the date/condition controls
      if (activePresetValue === 'personalizado') {
        // getActivePresetFilterValue already set these controls correctly
      }
    }
  }

  /**
   * Clear the date filter (fechaUltimaActualizacionPrecio)
   */
  clearPresetFilter(): void {
    this.activeFilters = this.activeFilters.filter(f => f.campo !== 'fechaUltimaActualizacionPrecio');
    this.presetFilterCtrl.setValue('', { emitEvent: false });
    this.presetCustomDateCtrl.setValue(null, { emitEvent: false });
    this.presetCustomDateCondCtrl.setValue('=', { emitEvent: false });
    this.fetchProducts(true);
  }

  /**
   * Apply preset filter and close the menu
   */
  applyPresetFilterAndClose(): void {
    this.applyPresetFilter();
    // Close the menu (needs to be called after a slight delay to allow the filter to apply)
    setTimeout(() => {
      this.filtersMenuTrigger?.closeMenu();
    }, 100);
  }

  removeFilter(filter: FilterCondition): void {
    const index = this.activeFilters.indexOf(filter);
    if (index >= 0) {
      this.activeFilters.splice(index, 1);
      // if the removed filter was the date preset, clear the controls
      if (filter.campo === 'fechaUltimaActualizacionPrecio') {
        this.presetFilterCtrl.setValue('', { emitEvent: false });
        this.presetCustomDateCtrl.setValue(null, { emitEvent: false });
        this.presetCustomDateCondCtrl.setValue('=', { emitEvent: false });
      }
      this.fetchProducts(true);
    }
  }

  clearAllFilters(): void {
    this.activeFilters = [];
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

    // Extract sorting rules from matSort
    const sortActiveField = this.sort?.active || 'nombre';
    const sortDirection = this.sort?.direction || 'asc';

    // Default check logic: sort is manually overridden if not 'nombre' ascending
    const hasCustomSorting = sortActiveField !== 'nombre' || sortDirection !== 'asc';

    let operation;

    if (hasFilters || hasCustomSorting) {
      // Use new busquedaPorFiltros endpoint
      const payload: any = {
        filtros: this.activeFilters.map(f => ({ campo: f.campo, condicion: f.condicion, valor: f.valor })),
        query: q, // Send the text query just in case the backend uses it
        page: pageToLoad,
        size: this.pageSize,
        campoOrdenamiento: sortActiveField,
        orden: sortDirection
      };
      operation = this.relationalProductService.busquedaPorFiltros(payload);
    } else {
      operation = this.relationalProductService.getProducts(q, pageToLoad, this.pageSize);
    }

    operation
      .pipe(finalize(() => {
        this.loading = false;
        this.loadingMore = false;
      }))
      .subscribe({
        next: (result: ProductPage) => {
          const content = result.content ?? [];
          this.totalPages = result.totalPages ?? 0;
          this.totalElements = result.totalElements ?? 0;
          this.pageIndex = pageToLoad;

          if (reset) {
            this.dataSource = content;
          } else {
            this.dataSource = this.dataSource.concat(content);
          }

          // Auto-open edit dialog only if:
          if (reset && shouldAutoEdit && !this.justClosedDialog && result.totalElements === 1 && content.length > 0) {
            this.editProduct(content[0]);
          }

          // Auto-open create product dialog only if:
          if (reset && result.totalElements === 0 && !this.justClosedDialog) {
            if (q && this.isNumericBarcode(q)) {
              this.createProduct(q);
            }
          }
        },
        error: () => {
          if (reset) {
            this.dataSource = [];
          }
        }
      });
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

  createProduct(barcode?: string) {
    // Only pass barcode if it has a value (trim and check)
    const trimmedBarcode = barcode?.trim();
    const dialogData = trimmedBarcode ? { barcode: trimmedBarcode } : null;
    const dialogRef = this.dialog.open(ProductEditComponent, {
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
    const dialogRef = this.dialog.open(ProductEditComponent, {
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

  private focusSearchInput() {
    // Always focus on search input when dialog closes
    if (this.searchInput?.nativeElement) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
        // If there's text, select all
        if (this.searchCtrl.value) {
          this.searchInput.nativeElement.select();
        }
      }, 100);
    }
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

}
