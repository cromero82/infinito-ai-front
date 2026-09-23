import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
  of,
  catchError
} from 'rxjs';
import {
  EntradaInventarioDetalleDto,
  EntradaInventarioDto,
  EntradaInventarioService,
  PrecioCompraPreviewDto
} from './service/entrada-inventario.service';
import { RelationalProductService } from '../../productos/service/relational-product.service';
import { Producto } from '../../productos/model/producto';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../auth/service/configuration.service';
import {
  HistorialPrecioProductoDto,
  HistorialPrecioProductoService
} from './service/historial-precio-producto.service';
import { EgresosService } from '../egresos/service/egresos.service';
import { egresoPermiteEntradaInventario } from '../egresos/util/egreso-permite-entrada-inventario.util';
import {
  calcularPrecioVentaAjustado,
  calcularPrecioVentaMantenerMargen,
  deltaPrecioCompraPesos
} from './util/ajustar-precio-venta.util';

export interface HistorialPrecioResumen {
  eventos: number;
  compraAnterior: number | null;
  compraActual: number | null;
  ventaAnterior: number | null;
  ventaActual: number | null;
  variacionCompraPct: number | null;
  variacionVentaPct: number | null;
  variacionCompraPesos: number | null;
  variacionVentaPesos: number | null;
  anosSpan: number | null;
  comparaUltimasDos: boolean;
}

export interface HistorialPrecioChartPoint {
  id: number;
  fecha: string;
  compra: number;
  venta: number;
  margen: number;
  ganancia: number | null;
  ventaPct: number;
  compraRatio: number;
  margenRatio: number;
  deltaVenta: number | null;
}

export interface HistorialVistaColumna {
  item: HistorialPrecioProductoDto;
  pt: HistorialPrecioChartPoint;
}

@Component({
  selector: 'gm-entrada-inventario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  templateUrl: './entrada-inventario.component.html',
  styleUrl: './entrada-inventario.component.scss'
})
export class EntradaInventarioComponent implements OnInit, OnDestroy {
  egresoId!: number;
  entrada: EntradaInventarioDto | null = null;
  loading = true;
  savingLine = false;
  confirming = false;
  previewLoading = false;
  preview: PrecioCompraPreviewDto | null = null;
  modoValorTotal = false;
  historialPrecio: HistorialPrecioProductoDto[] = [];
  historialLoading = false;
  historialVistaPagina = 0;
  readonly historialVistaTamano = 3;

  lineForm: FormGroup;
  searchResults: Producto[] = [];
  selectedProduct: Producto | null = null;
  showSearchResults = false;

  displayedColumns = [
    'producto',
    'cantidad',
    'precioCompra',
    'precioVenta',
    'ganancia',
    'variacion',
    'alerta',
    'delete'
  ];

  private destroy$ = new Subject<void>();
  private preview$ = new Subject<{ productoId: number; precioCompra: number }>();
  private suppressSearch = false;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cantidadInput') cantidadInput!: ElementRef<HTMLInputElement>;
  @ViewChild('precioCompraInput') precioCompraInput!: ElementRef<HTMLInputElement>;
  @ViewChild('valorTotalInput') valorTotalInput!: ElementRef<HTMLInputElement>;
  @ViewChild('precioVentaInput') precioVentaInput!: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private entradaService: EntradaInventarioService,
    private egresosService: EgresosService,
    private historialPrecioService: HistorialPrecioProductoService,
    private productService: RelationalProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public configurationService: ConfigurationService
  ) {
    this.lineForm = this.fb.group({
      busqueda: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioCompra: [
        null as number | null,
        [Validators.required, Validators.min(0)]
      ],
      valorTotal: [null as number | null, [Validators.min(0)]],
      precioVenta: [
        null as number | null,
        [Validators.required, Validators.min(0)]
      ]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('egresoId');
    if (!idParam) {
      this.router.navigate(['/apps/financiero/egresos']);
      return;
    }
    this.egresoId = Number(idParam);
    this.initPreviewPipeline();
    this.validarEgresoYLoadEntrada();

    this.lineForm
      .get('busqueda')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term: string) => {
        if (this.suppressSearch) {
          this.suppressSearch = false;
          return;
        }
        if (this.selectedProduct) {
          this.ocultarResultadosBusqueda();
          return;
        }
        this.buscarProductos(term);
      });

    this.lineForm
      .get('precioCompra')
      ?.valueChanges.pipe(debounceTime(350), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.modoValorTotal) {
          this.triggerPreview();
        }
      });

    this.lineForm
      .get('valorTotal')
      ?.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => this.recalcPrecioCompraFromValorTotal());

    this.lineForm
      .get('cantidad')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.modoValorTotal) {
          this.recalcPrecioCompraFromValorTotal();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get editable(): boolean {
    return this.entrada?.estado === 'BORRADOR';
  }

  get detalles(): EntradaInventarioDetalleDto[] {
    return this.entrada?.detalles ?? [];
  }

  /** Ganancia/pérdida con precio compra registrado en catálogo */
  get gananciaActualPct(): number | null {
    if (!this.selectedProduct) return null;
    return this.calcGananciaPct(
      this.selectedProduct.precio,
      this.selectedProduct.precioCompra
    );
  }

  get gananciaActualDisplay(): string {
    return this.formatGananciaPct(this.gananciaActualPct);
  }

  get tienePrecioCompraActual(): boolean {
    return (
      this.selectedProduct?.precioCompra != null &&
      this.selectedProduct.precioCompra > 0
    );
  }

  get precioCompraIngresado(): number | null {
    const raw = this.lineForm.getRawValue().precioCompra;
    if (raw === '' || raw == null) return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }

  get valorTotalIngresado(): number | null {
    const raw = this.lineForm.get('valorTotal')?.value;
    if (raw === '' || raw == null) return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }

  get precioVentaAjustadoPreview(): number | null {
    return this.precioVentaAjusteResult?.precio ?? null;
  }

  get precioVentaAjusteResult(): ReturnType<
    typeof calcularPrecioVentaAjustado
  > | null {
    if (!this.selectedProduct || !this.preview?.tienePrecioCompraAnterior) {
      return null;
    }
    const ventaActual = this.selectedProduct.precio ?? 0;
    const compraAnterior = this.preview.precioCompraAnterior ?? 0;
    const compraNuevo =
      this.precioCompraIngresado ?? this.preview.precioCompraNuevo ?? 0;
    if (ventaActual <= 0 || compraAnterior <= 0 || compraNuevo <= 0) {
      return null;
    }
    return calcularPrecioVentaAjustado(
      ventaActual,
      compraAnterior,
      compraNuevo,
      this.gananciaActualPct
    );
  }

  get deltaCompraPesos(): number | null {
    if (!this.preview?.tienePrecioCompraAnterior) return null;
    const anterior = this.preview.precioCompraAnterior ?? 0;
    const nuevo =
      this.precioCompraIngresado ?? this.preview.precioCompraNuevo ?? 0;
    if (anterior <= 0 || nuevo <= 0) return null;
    return deltaPrecioCompraPesos(anterior, nuevo);
  }

  get ajustarDiferenciaLabel(): string {
    const result = this.precioVentaAjusteResult;
    if (result == null || result.deltaVenta === 0) {
      return 'Ajustar';
    }
    const sign = result.deltaVenta > 0 ? '+' : '−';
    return `Ajustar ${sign}${this.formatCurrency(Math.abs(result.deltaVenta))}`;
  }

  get puedeAjustarDiferencia(): boolean {
    const result = this.precioVentaAjusteResult;
    return (
      result != null &&
      result.deltaVenta !== 0 &&
      result.modo === 'delta_mas_cinco'
    );
  }

  get variacionCompraPctDisplay(): string {
    const pct = this.preview?.porcentajeVariacionCompra;
    if (pct == null) return '—';
    const sign = pct > 0 ? '+' : '';
    return `(${sign}${pct.toFixed(1)}%)`;
  }

  get deltaCompraPesosDisplay(): string {
    const delta = this.deltaCompraPesos;
    if (delta == null) return '—';
    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
    return `${sign}${this.formatCurrency(Math.abs(delta))}`;
  }

  get precioCompraActualDisplay(): string {
    if (!this.tienePrecioCompraActual) return 'Sin registrar';
    return this.formatCurrency(this.selectedProduct!.precioCompra);
  }

  get mantenerMargenVentaResult(): ReturnType<
    typeof calcularPrecioVentaMantenerMargen
  > | null {
    if (
      !this.selectedProduct ||
      this.precioCompraIngresado == null ||
      !this.hayVariacionPrecioCompra
    ) {
      return null;
    }
    const ventaActual = this.selectedProduct.precio ?? 0;
    if (ventaActual <= 0) return null;

    return calcularPrecioVentaMantenerMargen(
      ventaActual,
      this.precioCompraIngresado,
      this.gananciaActualPct,
      this.selectedProduct.precioCompra ?? this.preview?.precioCompraAnterior
    );
  }

  get puedeAjustarMargenGanancia(): boolean {
    const r = this.mantenerMargenVentaResult;
    return r != null && r.deltaVenta !== 0 && this.gananciaActualPct != null;
  }

  get ajustarMargenGananciaLabel(): string {
    const r = this.mantenerMargenVentaResult;
    if (r == null || r.deltaVenta === 0) return 'Ajustar';
    const sign = r.deltaVenta > 0 ? '+' : '−';
    return `Ajustar ${sign}${this.formatCurrency(Math.abs(r.deltaVenta))}`;
  }

  ajustarPrecioVentaMantenerMargen(): void {
    const r = this.mantenerMargenVentaResult;
    if (r == null || r.precio <= 0) return;
    this.lineForm.patchValue({ precioVenta: r.precio }, { emitEvent: true });
    setTimeout(() => this.focusPrecioVenta(true), 0);
  }

  get precioVentaIngresado(): number | null {
    const raw = this.lineForm.get('precioVenta')?.value;
    if (raw === '' || raw == null) return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }

  get hayVariacionPrecioCompra(): boolean {
    return !!(
      this.preview?.precioCompraCambio &&
      this.preview?.tienePrecioCompraAnterior &&
      this.precioCompraIngresado != null
    );
  }

  get nuevaGananciaPct(): number | null {
    if (!this.selectedProduct || this.precioCompraIngresado == null) return null;
    const precioVenta =
      this.precioVentaIngresado ?? this.selectedProduct.precio ?? null;
    return this.calcGananciaPct(precioVenta, this.precioCompraIngresado);
  }

  get historialPrecioAsc(): HistorialPrecioProductoDto[] {
    return [...this.historialPrecio].reverse();
  }

  get historialTotalPaginas(): number {
    const n = this.historialPrecio.length;
    if (n === 0) return 1;
    return Math.max(1, Math.ceil(n / this.historialVistaTamano));
  }

  /** Índice inicial en orden cronológico (asc) para la ventana visible. Página 0 = últimos 3. */
  get historialPaginaInicio(): number {
    const n = this.historialPrecioAsc.length;
    if (n <= this.historialVistaTamano) return 0;
    const start =
      n -
      this.historialVistaTamano -
      this.historialVistaPagina * this.historialVistaTamano;
    return Math.max(0, start);
  }

  /** Etiqueta de página: 1 = más antiguos, N = más recientes. */
  get historialPaginaEtiqueta(): number {
    return this.historialTotalPaginas - this.historialVistaPagina;
  }

  get historialChartPointsVisibles(): HistorialPrecioChartPoint[] {
    const start = this.historialPaginaInicio;
    return this.historialChartPoints.slice(start, start + this.historialVistaTamano);
  }

  get historialItemsPagina(): HistorialPrecioProductoDto[] {
    const start = this.historialPaginaInicio;
    return this.historialPrecioAsc.slice(start, start + this.historialVistaTamano);
  }

  get historialVistaColumnas(): HistorialVistaColumna[] {
    const items = this.historialItemsPagina;
    const points = this.historialChartPointsVisibles;
    return items
      .map((item, index) => ({ item, pt: points[index] }))
      .filter((col): col is HistorialVistaColumna => col.pt != null);
  }

  /** Flecha izquierda: ventana más antigua. */
  historialPaginaAnterior(): void {
    if (this.historialVistaPagina < this.historialTotalPaginas - 1) {
      this.historialVistaPagina++;
    }
  }

  /** Flecha derecha: ventana más reciente. */
  historialPaginaSiguiente(): void {
    if (this.historialVistaPagina > 0) {
      this.historialVistaPagina--;
    }
  }

  get historialEnPaginaMasAntigua(): boolean {
    return this.historialVistaPagina >= this.historialTotalPaginas - 1;
  }

  get historialEnPaginaMasReciente(): boolean {
    return this.historialVistaPagina === 0;
  }

  isHistorialItemLatest(item: HistorialPrecioProductoDto): boolean {
    const asc = this.historialPrecioAsc;
    return asc.length > 0 && asc[asc.length - 1].id === item.id;
  }

  itemAnteriorHistorial(
    item: HistorialPrecioProductoDto
  ): HistorialPrecioProductoDto | undefined {
    const asc = this.historialPrecioAsc;
    const idx = asc.findIndex((h) => h.id === item.id);
    return idx > 0 ? asc[idx - 1] : undefined;
  }

  get historialResumen(): HistorialPrecioResumen | null {
    const rows = this.historialPrecio;
    if (rows.length === 0) return null;

    const rowsAsc = this.historialPrecioAsc;
    const first = rowsAsc[0];
    const last = rowsAsc[rowsAsc.length - 1];

    let anosSpan: number | null = null;
    if (first.fechaCreacion && last.fechaCreacion) {
      const t0 = new Date(first.fechaCreacion).getTime();
      const t1 = new Date(last.fechaCreacion).getTime();
      if (!isNaN(t0) && !isNaN(t1) && t1 >= t0) {
        anosSpan = Math.max(1, Math.round((t1 - t0) / (365.25 * 24 * 3600 * 1000)));
      }
    }

    const comparaUltimasDos = rows.length >= 2;
    const ultima = rows[0];
    const penultima = rows[1];

    const compraAnterior = comparaUltimasDos
      ? penultima.precioCompra ?? null
      : ultima.precioCompraAntes ?? null;
    const compraActual = ultima.precioCompra ?? null;
    const ventaAnterior = comparaUltimasDos
      ? penultima.precioVenta ?? null
      : ultima.precioVentaAntes ?? null;
    const ventaActual = ultima.precioVenta ?? null;

    return {
      eventos: rows.length,
      compraAnterior,
      compraActual,
      ventaAnterior,
      ventaActual,
      variacionCompraPct: this.calcVariacionPct(compraAnterior, compraActual),
      variacionVentaPct: this.calcVariacionPct(ventaAnterior, ventaActual),
      variacionCompraPesos: this.calcDeltaPesos(compraAnterior, compraActual),
      variacionVentaPesos: this.calcDeltaPesos(ventaAnterior, ventaActual),
      anosSpan,
      comparaUltimasDos
    };
  }

  get historialChartPoints(): HistorialPrecioChartPoint[] {
    const rows = this.historialPrecioAsc;
    if (rows.length === 0) return [];

    const ventas = rows.map((r) => r.precioVenta ?? 0);
    const maxVenta = Math.max(...ventas, 1);

    return rows.map((r, idx) => {
      const compra = r.precioCompra ?? 0;
      const venta = r.precioVenta ?? 0;
      const margen = Math.max(0, venta - compra);
      const compraRatio = venta > 0 ? (compra / venta) * 100 : 0;
      const margenRatio = venta > 0 ? (margen / venta) * 100 : 0;
      const ventaAnterior = idx > 0 ? rows[idx - 1].precioVenta ?? null : null;
      const deltaVenta =
        ventaAnterior != null ? venta - ventaAnterior : null;

      return {
        id: r.id,
        fecha: r.fechaCreacion,
        compra,
        venta,
        margen,
        ganancia: r.porcentajeGanancia ?? null,
        ventaPct: (venta / maxVenta) * 100,
        compraRatio,
        margenRatio,
        deltaVenta
      };
    });
  }

  get nuevaGananciaDisplay(): string {
    return this.formatGananciaPct(this.nuevaGananciaPct);
  }

  private initPreviewPipeline(): void {
    this.preview$
      .pipe(
        debounceTime(250),
        switchMap(({ productoId, precioCompra }) => {
          if (!productoId || precioCompra == null || precioCompra < 0) {
            this.preview = null;
            this.previewLoading = false;
            return of(null);
          }
          this.previewLoading = true;
          return this.entradaService
            .previewPrecioCompra(productoId, precioCompra)
            .pipe(catchError(() => of(null)));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        this.preview = result;
        this.previewLoading = false;
      });
  }

  private validarEgresoYLoadEntrada(): void {
    this.loading = true;
    this.egresosService.getEgresoById(this.egresoId).subscribe({
      next: (egreso) => {
        if (!egresoPermiteEntradaInventario(egreso)) {
          this.loading = false;
          this.snackBar.open(
            'Este tipo de egreso no permite entrada de almacén',
            'Cerrar',
            { duration: 5000 }
          );
          this.router.navigate(['/apps/financiero/egresos']);
          return;
        }
        this.loadEntrada();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudo validar el egreso', 'Cerrar', {
          duration: 5000
        });
        this.router.navigate(['/apps/financiero/egresos']);
      }
    });
  }

  private loadEntrada(): void {
    this.loading = true;
    this.entradaService.obtenerOCrearPorEgreso(this.egresoId).subscribe({
      next: (entrada: EntradaInventarioDto) => {
        this.entrada = entrada;
        this.loading = false;
        setTimeout(() => this.focusBusqueda(), 150);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudo cargar la entrada de inventario', 'Cerrar', {
          duration: 5000
        });
        this.router.navigate(['/apps/financiero/egresos']);
      }
    });
  }

  private buscarProductos(term: string): void {
    const q = (term ?? '').trim();
    if (q.length < 2) {
      this.ocultarResultadosBusqueda();
      return;
    }

    if (this.isNumericBarcode(q)) {
      this.productService.searchByBarcode(q).subscribe({
        next: (producto) => this.seleccionarProducto(producto),
        error: () => this.buscarPorTexto(q)
      });
      return;
    }

    this.buscarPorTexto(q);
  }

  private buscarPorTexto(q: string): void {
    this.productService.getProducts(q, 0, 8).subscribe({
      next: (page) => {
        this.searchResults = page.content ?? [];
        this.showSearchResults = this.searchResults.length > 0;
      },
      error: () => this.ocultarResultadosBusqueda()
    });
  }

  private ocultarResultadosBusqueda(): void {
    this.searchResults = [];
    this.showSearchResults = false;
  }

  onModoValorTotalChange(activo: boolean): void {
    this.modoValorTotal = activo;
    const valorTotalCtrl = this.lineForm.get('valorTotal');
    const precioCompraCtrl = this.lineForm.get('precioCompra');

    if (activo) {
      valorTotalCtrl?.setValidators([Validators.required, Validators.min(0)]);
      this.syncValorTotalFromPrecioCompra();
      precioCompraCtrl?.disable({ emitEvent: false });
    } else {
      valorTotalCtrl?.clearValidators();
      valorTotalCtrl?.setValidators([Validators.min(0)]);
      precioCompraCtrl?.enable({ emitEvent: false });
    }
    valorTotalCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private syncValorTotalFromPrecioCompra(): void {
    const pc = this.precioCompraIngresado;
    const qty = Number(this.lineForm.get('cantidad')?.value) || 1;
    if (pc != null && pc > 0) {
      this.lineForm.patchValue(
        { valorTotal: Math.round(pc * qty) },
        { emitEvent: false }
      );
    }
  }

  private recalcPrecioCompraFromValorTotal(): void {
    if (!this.modoValorTotal) return;
    const vt = this.valorTotalIngresado;
    const qty = Number(this.lineForm.get('cantidad')?.value);
    if (vt == null || vt < 0 || !qty || qty <= 0) {
      this.lineForm.patchValue({ precioCompra: null }, { emitEvent: false });
      this.preview = null;
      return;
    }
    const pc = Math.round(vt / qty);
    this.lineForm.patchValue({ precioCompra: pc }, { emitEvent: false });
    this.triggerPreview();
  }

  private focusValorTotal(selectAll = false): void {
    const el = this.valorTotalInput?.nativeElement;
    if (!el) return;
    el.focus();
    if (selectAll) {
      setTimeout(() => el.select(), 0);
    }
  }

  onValorTotalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusPrecioVenta(true);
    }
  }

  seleccionarProducto(producto: Producto): void {
    this.selectedProduct = producto;
    this.ocultarResultadosBusqueda();

    const label = producto.barcode
      ? `${producto.barcode} — ${producto.nombre}`
      : producto.nombre;

    this.suppressSearch = true;
    this.lineForm.patchValue(
      {
        busqueda: label,
        cantidad: 1,
        precioCompra:
          producto.precioCompra && producto.precioCompra > 0
            ? producto.precioCompra
            : null,
        precioVenta: producto.precio ?? null
      },
      { emitEvent: false }
    );

    if (this.modoValorTotal) {
      this.syncValorTotalFromPrecioCompra();
      this.recalcPrecioCompraFromValorTotal();
    }

    this.preview = null;
    if (producto.id != null) {
      this.cargarHistorialPrecio(producto.id);
    }
    setTimeout(() => {
      this.focusCantidad(true);
      this.triggerPreview();
    }, 50);
  }

  limpiarProducto(): void {
    this.selectedProduct = null;
    this.preview = null;
    this.historialPrecio = [];
    this.historialLoading = false;
    this.historialVistaPagina = 0;
    this.ocultarResultadosBusqueda();
    this.suppressSearch = false;
    this.lineForm.patchValue(
      { busqueda: '', precioCompra: null, precioVenta: null, valorTotal: null, cantidad: 1 },
      { emitEvent: false }
    );
    if (this.modoValorTotal) {
      this.lineForm.get('precioCompra')?.disable({ emitEvent: false });
    }
    setTimeout(() => this.focusBusqueda(), 50);
  }

  focusBusqueda(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const el = this.searchInput?.nativeElement;
    if (el) {
      el.focus();
      el.select();
    }
  }

  private focusCantidad(selectAll = false): void {
    const el = this.cantidadInput?.nativeElement;
    if (!el) return;
    el.focus();
    if (selectAll) {
      setTimeout(() => el.select(), 0);
    }
  }

  private focusPrecioCompra(selectAll = false): void {
    const el = this.precioCompraInput?.nativeElement;
    if (!el) return;
    el.focus();
    if (selectAll) {
      setTimeout(() => el.select(), 0);
    }
  }

  onBusquedaKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    if (this.selectedProduct && this.lineForm.valid) {
      this.agregarLinea();
      return;
    }

    const q = (this.lineForm.get('busqueda')?.value ?? '').trim();
    if (!q) return;

    if (this.searchResults.length === 1) {
      this.seleccionarProducto(this.searchResults[0]);
      return;
    }

    if (this.isNumericBarcode(q)) {
      this.productService.searchByBarcode(q).subscribe({
        next: (p) => this.seleccionarProducto(p),
        error: () =>
          this.snackBar.open('Producto no encontrado', 'Cerrar', { duration: 3000 })
      });
    }
  }

  onCantidadKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.modoValorTotal) {
        this.focusValorTotal(true);
      } else {
        this.focusPrecioCompra(true);
      }
    }
  }

  private focusPrecioVenta(selectAll = false): void {
    const el = this.precioVentaInput?.nativeElement;
    if (!el) return;
    el.focus();
    if (selectAll) {
      setTimeout(() => el.select(), 0);
    }
  }

  ajustarNuevoPrecioVenta(): void {
    const ajustado = this.precioVentaAjustadoPreview;
    if (ajustado == null) return;
    this.lineForm.patchValue({ precioVenta: ajustado }, { emitEvent: true });
    setTimeout(() => this.focusPrecioVenta(true), 0);
  }

  onPrecioCompraKeydown(event: KeyboardEvent): void {
    if (this.modoValorTotal) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusPrecioVenta(true);
    }
  }

  onPrecioVentaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregarLinea();
    }
  }

  triggerPreview(): void {
    if (!this.selectedProduct?.id) {
      this.preview = null;
      return;
    }
    const precioCompra = this.precioCompraIngresado;
    if (precioCompra == null) {
      this.preview = null;
      return;
    }
    this.preview$.next({ productoId: this.selectedProduct.id, precioCompra });
  }

  agregarLinea(): void {
    if (!this.editable || !this.entrada?.id || !this.selectedProduct?.id) {
      return;
    }
    if (this.modoValorTotal) {
      this.recalcPrecioCompraFromValorTotal();
    }
    if (this.lineForm.invalid) {
      this.lineForm.markAllAsTouched();
      if (!this.selectedProduct) {
        this.focusBusqueda();
      } else if (this.modoValorTotal && this.lineForm.get('valorTotal')?.invalid) {
        this.focusValorTotal(true);
      } else if (this.lineForm.get('precioCompra')?.invalid) {
        if (this.modoValorTotal) {
          this.focusValorTotal(true);
        } else {
          this.focusPrecioCompra(true);
        }
      } else if (this.lineForm.get('precioVenta')?.invalid) {
        this.focusPrecioVenta(true);
      } else {
        this.focusCantidad(true);
      }
      return;
    }

    this.savingLine = true;
    const raw = this.lineForm.getRawValue();
    const cantidad = Number(raw.cantidad);
    const precioCompra = Number(raw.precioCompra);
    const precioVenta = Number(raw.precioVenta);

    this.entradaService
      .agregarDetalle(this.entrada.id, {
        productoId: this.selectedProduct.id,
        cantidad,
        precioCompra,
        precioVenta
      })
      .subscribe({
        next: () => {
          this.savingLine = false;
          this.snackBar.open('Producto agregado a la entrada', 'Cerrar', {
            duration: 2500
          });
          this.limpiarProducto();
          this.reloadDetalles();
        },
        error: (err: {
          error?: { detalle?: string; errores?: { descripcionError?: string }[] };
        }) => {
          this.savingLine = false;
          const msg =
            err?.error?.detalle ||
            err?.error?.errores?.[0]?.descripcionError ||
            'No se pudo agregar el producto';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        }
      });
  }

  eliminarLinea(detalle: EntradaInventarioDetalleDto): void {
    if (!this.editable || !this.entrada?.id) return;

    this.entradaService.eliminarDetalle(this.entrada.id, detalle.id).subscribe({
      next: (entrada: EntradaInventarioDto) => {
        this.entrada = entrada;
      },
      error: () =>
        this.snackBar.open('No se pudo eliminar la línea', 'Cerrar', {
          duration: 4000
        })
    });
  }

  confirmarEntrada(): void {
    if (!this.editable || !this.entrada?.id || this.detalles.length === 0) {
      return;
    }

    const dialogData: ConfirmDialogData = {
      titulo: 'Confirmar entrada de inventario',
      mensaje: `¿Confirma aplicar ${this.detalles.length} producto(s) al inventario? Se actualizarán existencias, precios de compra y venta cuando corresponda.`
    };

    this.dialog
      .open(ConfirmDialogComponent, { width: '420px', data: dialogData })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.ejecutarConfirmacion();
      });
  }

  private ejecutarConfirmacion(): void {
    if (!this.entrada?.id) return;
    this.confirming = true;
    this.entradaService.confirmar(this.entrada.id).subscribe({
      next: (entrada: EntradaInventarioDto) => {
        this.entrada = entrada;
        this.confirming = false;
        this.snackBar.open('Entrada de inventario confirmada', 'Cerrar', {
          duration: 4000
        });
      },
      error: (err: { error?: { detalle?: string } }) => {
        this.confirming = false;
        const msg = err?.error?.detalle || 'No se pudo confirmar la entrada';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  private reloadDetalles(): void {
    if (!this.egresoId) return;
    this.entradaService.getByEgreso(this.egresoId).subscribe({
      next: (entrada: EntradaInventarioDto) => (this.entrada = entrada)
    });
  }

  private cargarHistorialPrecio(productoId: number): void {
    this.historialLoading = true;
    this.historialPrecio = [];
    this.historialPrecioService.findByProductoId(productoId).subscribe({
      next: (rows) => {
        this.historialPrecio = rows ?? [];
        this.historialVistaPagina = 0;
        this.historialLoading = false;
      },
      error: () => {
        this.historialLoading = false;
      }
    });
  }

  calcDeltaPesos(
    anterior: number | null | undefined,
    nuevo: number | null | undefined
  ): number | null {
    if (anterior == null || nuevo == null || isNaN(anterior) || isNaN(nuevo)) {
      return null;
    }
    return nuevo - anterior;
  }

  tieneVariacionResumen(deltaPesos: number | null, pct: number | null): boolean {
    return (
      (deltaPesos != null && deltaPesos !== 0) ||
      (pct != null && pct !== 0)
    );
  }

  formatDeltaPesosResumen(delta: number | null | undefined): string {
    if (delta == null || isNaN(delta) || delta === 0) return '';
    const sign = delta > 0 ? '+' : '−';
    return `${sign}${this.formatCurrency(Math.abs(delta))}`;
  }

  formatDeltaPesosChart(delta: number | null | undefined): string {
    return this.formatDeltaPesosResumen(delta);
  }

  formatPctResumen(pct: number | null | undefined): string {
    if (pct == null || isNaN(pct)) return '';
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  }

  calcVariacionPct(
    anterior: number | null | undefined,
    nuevo: number | null | undefined
  ): number | null {
    if (
      anterior == null ||
      nuevo == null ||
      anterior <= 0 ||
      isNaN(anterior) ||
      isNaN(nuevo)
    ) {
      return null;
    }
    return ((nuevo - anterior) / anterior) * 100;
  }

  formatFechaHistorial(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  }

  formatFechaHistorialCorta(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-CO', {
      month: 'short',
      year: '2-digit'
    }).format(d);
  }

  deltaHistorialDisplay(
    antes: number | null | undefined,
    despues: number | null | undefined
  ): string {
    if (despues == null) return '—';
    if (antes == null) return this.formatCurrency(despues);
    const delta = despues - antes;
    if (delta === 0) return this.formatCurrency(despues);
    const sign = delta > 0 ? '+' : '−';
    return `${this.formatCurrency(despues)} (${sign}${this.formatCurrency(Math.abs(delta))})`;
  }

  claseDeltaHistorial(
    antes: number | null | undefined,
    despues: number | null | undefined
  ): 'up' | 'down' | 'flat' | 'new' {
    if (despues == null) return 'flat';
    if (antes == null) return 'new';
    if (despues > antes) return 'up';
    if (despues < antes) return 'down';
    return 'flat';
  }

  gananciaHistorialDisplay(item: HistorialPrecioProductoDto): string {
    const pct = item.porcentajeGanancia;
    if (pct == null) return '—';
    const antes = item.porcentajeGananciaAntes;
    if (antes == null || antes === pct) {
      return this.formatGananciaPct(pct);
    }
    const delta = pct - antes;
    const sign = delta > 0 ? '+' : '−';
    return `${this.formatGananciaPct(pct)} (${sign}${Math.abs(delta)} pp)`;
  }

  private isNumericBarcode(value: string): boolean {
    const v = (value ?? '').trim();
    return v.length >= 4 && /^\d+$/.test(v);
  }

  calcGananciaPct(
    precioVenta: number | null | undefined,
    precioCompra: number | null | undefined
  ): number | null {
    if (
      precioVenta == null ||
      precioCompra == null ||
      precioCompra <= 0 ||
      isNaN(precioVenta) ||
      isNaN(precioCompra)
    ) {
      return null;
    }
    return ((precioVenta - precioCompra) / precioCompra) * 100;
  }

  formatGananciaPct(percent: number | null | undefined): string {
    if (percent == null || isNaN(percent)) return '—';
    if (percent < 1 && percent >= 0) return 'Menos del 1 %';
    return `${percent.toFixed(1)} %`;
  }

  esGananciaNegativa(percent: number | null | undefined): boolean {
    return percent != null && percent < 0;
  }

  esPerdidaLabel(percent: number | null | undefined): string {
    if (percent == null) return 'Ganancia / pérdida';
    return percent < 0 ? 'Pérdida' : 'Ganancia';
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatCurrencyCompact(value: number | null | undefined): string {
    if (value == null) return '—';
    if (value >= 1000) {
      const miles = value / 1000;
      const dec = miles >= 10 ? 0 : 1;
      return `$${miles.toFixed(dec)}k`;
    }
    return this.formatCurrency(value);
  }

  diffDesdeAnteriorHistorial(
    fechaActual: string | undefined,
    fechaAnterior: string | undefined
  ): string {
    if (!fechaActual || !fechaAnterior) return '';
    const tActual = new Date(fechaActual).getTime();
    const tAnterior = new Date(fechaAnterior).getTime();
    if (isNaN(tActual) || isNaN(tAnterior) || tActual < tAnterior) return '';

    const days = Math.floor((tActual - tAnterior) / (24 * 3600 * 1000));
    if (days === 0) {
      return '0 días';
    }
    if (days < 60) {
      return `+${days} día${days !== 1 ? 's' : ''}`;
    }
    const months = Math.round(days / 30.44);
    if (months < 24) {
      return `+${months} mes${months !== 1 ? 'es' : ''}`;
    }
    const years = Math.round(days / 365.25);
    return `+${years} año${years !== 1 ? 's' : ''}`;
  }

  nombreProducto(detalle: EntradaInventarioDetalleDto): string {
    return (
      detalle.producto?.nombre ||
      this.preview?.productoNombre ||
      `Producto #${detalle.productoId}`
    );
  }

  barcodeProducto(detalle: EntradaInventarioDetalleDto): string {
    return detalle.producto?.barcode ?? '—';
  }

  precioVentaDisplay(detalle: EntradaInventarioDetalleDto): string {
    const valor = detalle.precioVentaNuevo ?? detalle.precioVentaActual;
    if (valor == null) return '—';
    const base = this.formatCurrency(valor);
    if (
      detalle.precioVentaNuevo != null &&
      detalle.precioVentaActual != null &&
      detalle.precioVentaNuevo !== detalle.precioVentaActual
    ) {
      return `${base} *`;
    }
    return base;
  }

  gananciaDisplay(detalle: EntradaInventarioDetalleDto): string {
    if (detalle.porcentajeGananciaCalc == null) return '—';
    return this.formatGananciaPct(detalle.porcentajeGananciaCalc);
  }

  variacionDisplay(detalle: EntradaInventarioDetalleDto): string {
    if (detalle.porcentajeVariacionCompra == null) return '—';
    const pct = detalle.porcentajeVariacionCompra;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)} %`;
  }

  showGananciaInferiorPreview(): boolean {
    const pct = this.nuevaGananciaPct;
    if (pct == null) return false;
    return pct < this.configurationService.obtenerPorcentajeMinimoGanancia();
  }

  estadoLabel(estado: string | undefined): string {
    switch (estado) {
      case 'CONFIRMADA':
        return 'Confirmada';
      case 'ANULADA':
        return 'Anulada';
      default:
        return 'Borrador';
    }
  }
}
