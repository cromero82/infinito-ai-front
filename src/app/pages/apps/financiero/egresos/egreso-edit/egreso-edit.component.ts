import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common';
import { Observable, Subject, forkJoin, of, merge, timer } from 'rxjs';
import {
  map,
  startWith,
  combineLatestWith,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  EgresosService,
  EgresoDto,
  CreateEgresoRequest,
  EgresoEditDialogData,
  FormalizarEgresoDialogData
} from '../service/egresos.service';
import {
  ProveedorService,
  ProveedorDto
} from '../../proveedores/service/proveedor.service';
import { ProveedorEditComponent } from '../../proveedores/proveedor-edit/proveedor-edit.component';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';
import { OrigenFondosService } from '../../origenes-fondos/service/origen-fondos.service';
import {
  MovimientoOrigenFondosDto,
  MovimientoOrigenFondosService
} from '../../origenes-fondos/service/movimiento-origen-fondos.service';
import {
  GestionNotificacionesMediosService,
  PlantillaNotificacionPagoDto
} from '../../../ventas/service/gestion-notificaciones-medios.service';
import { EstablecimientoService } from '../../../ventas/service/establecimiento.service';
import { CorteVentaService } from '../../../ventas/service/corte-venta.service';
import {
  OrigenFondosArbolItemDto,
  etiquetaOrigenConSaldo,
  mapVentasSinCortePorMetodo,
  paramsConsultarRangoHastaAhora,
  saldoOrigenConVentasSinCorte
} from '../../origenes-fondos/util/origen-fondos-arbol.util';

@Component({
  selector: 'gm-egreso-edit',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './egreso-edit.component.html',
  styleUrl: './egreso-edit.component.scss'
})
export class EgresoEditComponent implements OnInit, OnDestroy, AfterViewInit {
  form: FormGroup;
  proveedores: ProveedorDto[] = [];
  origenesArbol: OrigenFondosArbolItemDto[] = [];
  /** Árbol completo (incluye hijos) para cruzar plantillas destino ↔ padre. */
  private arbolCompleto: OrigenFondosArbolItemDto[] = [];
  private plantillas: PlantillaNotificacionPagoDto[] = [];
  modoEstricto = false;
  private ventasSinCortePorMetodo = new Map<number, number>();
  filteredProveedores$!: Observable<ProveedorDto[]>;
  mostrarBotonCrearProveedor$!: Observable<boolean>;
  valorEditando = false;

  /**
   * Pago QR / plantilla: el OF elegido tiene bolsa hija destino → no egresar del padre
   * hasta identificar el movimiento en la bolsa.
   */
  requiereMatchPagoLinea = false;
  buscandoMatchPagoLinea = false;
  movimientoPagoLinea: MovimientoOrigenFondosDto | null = null;
  mensajePagoLinea: string | null = null;
  /** Observación autollenada desde el movimiento match (para no pisar edición manual). */
  private descripcionAutoPagoLinea: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly reintentarMatch$ = new Subject<void>();

  private readonly valorDisplayFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  private readonly valorPreviewFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  @ViewChild('fechaInput') fechaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('valorInput') valorInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EgresoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EgresoEditDialogData,
    private egresosService: EgresosService,
    private proveedorService: ProveedorService,
    private origenFondosService: OrigenFondosService,
    private movimientoOrigenFondosService: MovimientoOrigenFondosService,
    private notificacionesMediosService: GestionNotificacionesMediosService,
    private corteVentaService: CorteVentaService,
    private establecimientoService: EstablecimientoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fechaUtilService: FechaUtilService
  ) {
    this.form = this.fb.group({
      fecha: [new Date() as Date | null, Validators.required],
      valor: ['', [Validators.required, this.validarValorMonto.bind(this)]],
      descripcion: [''],
      proveedor: [null as ProveedorDto | null, Validators.required],
      origenCuentaId: [null as number | null, Validators.required]
    });
  }

  get formalizarData(): FormalizarEgresoDialogData | null {
    if (
      this.data &&
      typeof this.data === 'object' &&
      'mode' in this.data &&
      this.data.mode === 'formalizar'
    ) {
      return this.data;
    }
    return null;
  }

  get egresoData(): EgresoDto | null {
    if (this.data && typeof this.data === 'object' && 'id' in this.data) {
      return this.data;
    }
    return null;
  }

  get isFormalizarMode(): boolean {
    return this.formalizarData != null || this.movimientoPagoLinea != null;
  }

  get origenSeleccionado(): OrigenFondosArbolItemDto | undefined {
    const id = this.form.get('origenCuentaId')?.value as number | null;
    return this.origenesArbol.find((o) => o.id === id);
  }

  get advertenciaSaldoOrigen(): string | null {
    if (this.modoEstricto || this.isFormalizarMode) {
      return null;
    }
    const origen = this.origenSeleccionado;
    const valor = this.parseCurrency(this.form.get('valor')?.value);
    if (!origen || valor <= 0) {
      return null;
    }
    const saldo = this.saldoParcial(origen);
    if (saldo < valor) {
      return `Saldo parcial insuficiente en «${origen.nombre}» (${this.formatSaldo(saldo)}). Se permitirá en modo flexible.`;
    }
    if (saldo === 0) {
      return `«${origen.nombre}» está en $0 (total parcial). Revise antes de egresar.`;
    }
    return null;
  }

  get mostrarValorPreviewSuffix(): boolean {
    if (!this.valorEditando) {
      return false;
    }
    const digits = String(this.form.get('valor')?.value ?? '').replace(/[^\d]/g, '');
    return digits.length > 0;
  }

  get valorPreviewFormateado(): string {
    return this.formatValorPreview(this.parseCurrency(this.form.get('valor')?.value));
  }

  get submitDisabled(): boolean {
    if (this.form.invalid) {
      return true;
    }
    if (this.formalizarData || this.isEditMode) {
      return false;
    }
    if (this.requiereMatchPagoLinea && !this.movimientoPagoLinea) {
      return true;
    }
    return false;
  }

  ngOnInit() {
    this.establecimientoService.loadActual().subscribe({
      next: (est) => {
        this.modoEstricto = !!est.manejoEstrictoCuentas;
      }
    });
    this.loadProveedores();
    this.loadOrigenesArbol();

    this.filteredProveedores$ = this.form.get('proveedor')!.valueChanges.pipe(
      startWith(this.form.get('proveedor')!.value),
      map((value) => this.filterProveedores(value))
    );

    this.mostrarBotonCrearProveedor$ = this.filteredProveedores$.pipe(
      combineLatestWith(
        this.form.get('proveedor')!.valueChanges.pipe(startWith(this.form.get('proveedor')!.value))
      ),
      map(([filtered, value]) => {
        if (typeof value === 'object' && value !== null) {
          return false;
        }
        const isFiltering = typeof value === 'string' && (value || '').trim().length > 0;
        return isFiltering && filtered.length === 0;
      })
    );

    const formalizar = this.formalizarData;
    const egreso = this.egresoData;
    if (formalizar) {
      this.form.patchValue({
        valor: this.formatValorDisplay(formalizar.valor ?? 0),
        origenCuentaId: formalizar.origenFondosId,
        descripcion: formalizar.terceroNombre
          ? `Pago ${formalizar.terceroNombre}`
          : ''
      });
      this.form.get('origenCuentaId')?.disable({ emitEvent: false });
      this.patchProveedorAfterLoad();
    } else if (egreso) {
      const prov = egreso.proveedor;
      this.form.patchValue({
        fecha: egreso.fecha
          ? this.fechaUtilService.parseDateAsLocal(egreso.fecha)
          : null,
        valor: this.formatValorDisplay(egreso.valor ?? 0),
        descripcion: egreso.descripcion || '',
        proveedor: prov
          ? { id: prov.id, nombre: prov.nombre, tipoEgreso: prov.tipoEgreso }
          : null,
        origenCuentaId: egreso.origenFondosId ?? null
      });
      this.patchProveedorAfterLoad();
    } else {
      this.form.patchValue({ valor: this.formatValorDisplay(0) });
      this.iniciarWatcherPagoLinea();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private iniciarWatcherPagoLinea(): void {
    const valor$ = this.form.get('valor')!.valueChanges.pipe(
      startWith(this.form.get('valor')!.value),
      map((v) => this.parseCurrency(v)),
      distinctUntilChanged()
    );
    const origen$ = this.form.get('origenCuentaId')!.valueChanges.pipe(
      startWith(this.form.get('origenCuentaId')!.value),
      map((id) => (id == null ? null : Number(id))),
      distinctUntilChanged()
    );

    merge(
      valor$.pipe(map(() => void 0)),
      origen$.pipe(map(() => void 0)),
      this.reintentarMatch$,
      timer(0, 4000).pipe(map(() => void 0))
    )
      .pipe(
        debounceTime(350),
        takeUntil(this.destroy$),
        switchMap(() => {
          const origenId = this.form.get('origenCuentaId')?.value as number | null;
          const valor = this.parseCurrency(this.form.get('valor')?.value);
          const bolsas = origenId != null ? this.bolsasDestinoPlantilla(origenId) : [];

          if (!origenId || !(valor > 0) || bolsas.length === 0) {
            this.requiereMatchPagoLinea = false;
            this.buscandoMatchPagoLinea = false;
            this.limpiarMatchPagoLinea();
            return of(null);
          }

          this.requiereMatchPagoLinea = true;
          this.buscandoMatchPagoLinea = true;
          if (!this.movimientoPagoLinea) {
            this.mensajePagoLinea =
              'Buscando / Esperando el movimiento del pago en línea (mismo valor en la bolsa destino de la plantilla)…';
          }

          return this.buscarCandidatosPagoLinea(bolsas, valor).pipe(
            tap((list) => this.aplicarCandidatosPagoLinea(list, origenId))
          );
        })
      )
      .subscribe();
  }

  /**
   * Prefiere el endpoint dedicado; si no está (BE sin reiniciar / error),
   * consulta movimientos de la bolsa con el API existente.
   */
  private buscarCandidatosPagoLinea(
    bolsas: number[],
    valor: number
  ): Observable<MovimientoOrigenFondosDto[]> {
    return this.movimientoOrigenFondosService
      .findCandidatosFormalizarEgreso(bolsas, valor)
      .pipe(catchError(() => this.buscarCandidatosEnBolsas(bolsas, valor)));
  }

  private buscarCandidatosEnBolsas(
    bolsas: number[],
    valor: number
  ): Observable<MovimientoOrigenFondosDto[]> {
    if (!bolsas.length || !(valor > 0)) {
      return of([]);
    }
    return forkJoin(
      bolsas.map((id) =>
        this.movimientoOrigenFondosService
          .findByCuenta(id)
          .pipe(catchError(() => of([] as MovimientoOrigenFondosDto[])))
      )
    ).pipe(
      map((lists) => {
        const tipo = 'MOVIMIENTO BANCO POR IDENTIFICAR';
        return lists
          .flat()
          .filter((m) => {
            const impacto = Number(m.impacto ?? 0);
            const v = Number(m.valor ?? 0);
            const ot = (m.origenTipo ?? '').trim().toUpperCase();
            return impacto > 0 && ot === tipo && Math.abs(v - valor) < 0.01;
          })
          .sort((a, b) => b.id - a.id);
      })
    );
  }

  private aplicarCandidatosPagoLinea(
    list: MovimientoOrigenFondosDto[],
    origenPadreId: number
  ): void {
    this.buscandoMatchPagoLinea = false;
    const match = list[0] ?? null;
    const prevId = this.movimientoPagoLinea?.id ?? null;
    this.movimientoPagoLinea = match;
    if (match) {
      const bolsaNombre =
        match.origenFondosNombre ||
        this.arbolCompleto.find((o) => o.id === match.origenFondosId)?.nombre ||
        'la bolsa';
      const padreNombre =
        this.origenesArbol.find((o) => o.id === origenPadreId)?.nombre ||
        'el banco';
      this.mensajePagoLinea =
        `Se identificó el movimiento del pago en línea (${bolsaNombre}). ` +
        `El egreso saldrá de esa bolsa, sin restar de nuevo «${padreNombre}».`;
      if (prevId !== match.id) {
        this.aplicarObservacionDesdeMovimiento(match);
        this.sugerirProveedorDesdeMovimiento(match);
      }
    } else {
      this.mensajePagoLinea =
        'Buscando / Esperando el movimiento del pago en línea (mismo valor en la bolsa destino de la plantilla). El registro permanece deshabilitado hasta identificarlo.';
      this.limpiarObservacionAutoPagoLinea();
    }
  }

  /** Misma observación que Formalizar egreso desde Orígenes; el BE añade Notif/mov al guardar. */
  private aplicarObservacionDesdeMovimiento(m: MovimientoOrigenFondosDto): void {
    const actual = String(this.form.get('descripcion')?.value ?? '').trim();
    if (
      actual &&
      this.descripcionAutoPagoLinea != null &&
      actual !== this.descripcionAutoPagoLinea
    ) {
      return;
    }
    const tercero = (m.terceroNombre ?? '').trim();
    const texto = tercero
      ? `Pago ${tercero}`
      : m.idReferencia != null
        ? `Notif #${m.idReferencia}`
        : `Mov #${m.id}`;
    this.descripcionAutoPagoLinea = texto;
    this.form.patchValue({ descripcion: texto }, { emitEvent: false });
  }

  private sugerirProveedorDesdeMovimiento(m: MovimientoOrigenFondosDto): void {
    const nombre = (m.terceroNombre ?? '').trim();
    if (!nombre) {
      return;
    }
    const actual = this.form.get('proveedor')?.value;
    if (typeof actual === 'object' && actual !== null && (actual as ProveedorDto).id) {
      return;
    }
    const match = this.proveedores.find(
      (p) => p.nombre.toLowerCase() === nombre.toLowerCase()
    );
    if (match) {
      this.form.patchValue({ proveedor: match }, { emitEvent: false });
    } else if (!actual || (typeof actual === 'string' && !actual.trim())) {
      this.form.patchValue({ proveedor: nombre }, { emitEvent: true });
    }
  }

  private limpiarMatchPagoLinea(): void {
    this.movimientoPagoLinea = null;
    this.mensajePagoLinea = null;
    this.limpiarObservacionAutoPagoLinea();
  }

  private limpiarObservacionAutoPagoLinea(): void {
    if (this.descripcionAutoPagoLinea == null) {
      return;
    }
    const actual = String(this.form.get('descripcion')?.value ?? '').trim();
    if (actual === this.descripcionAutoPagoLinea) {
      this.form.patchValue({ descripcion: '' }, { emitEvent: false });
    }
    this.descripcionAutoPagoLinea = null;
  }

  /** OF destino de plantillas cuyo padre (o origen de plantilla) es el OF seleccionado. */
  private bolsasDestinoPlantilla(padreId: number): number[] {
    const ids = new Set<number>();
    const porId = new Map(this.arbolCompleto.map((o) => [o.id, o]));
    for (const p of this.plantillas) {
      const destId = p.origenFondosDestinoId;
      if (destId == null) {
        continue;
      }
      const dest = porId.get(destId);
      if (dest?.parentOrigenFondosId === padreId) {
        ids.add(destId);
      }
      if (p.origenFondosOrigenId === padreId) {
        ids.add(destId);
      }
    }
    return [...ids];
  }

  private loadOrigenesArbol() {
    forkJoin({
      arbolEgreso: this.origenFondosService.findArbolParaEgreso(),
      arbol: this.origenFondosService.findArbol().pipe(catchError(() => of([]))),
      rango: this.corteVentaService
        .consultarRango(paramsConsultarRangoHastaAhora())
        .pipe(catchError(() => of(null))),
      plantillas: this.notificacionesMediosService
        .listarPlantillas()
        .pipe(catchError(() => of([] as PlantillaNotificacionPagoDto[])))
    }).subscribe({
      next: ({ arbolEgreso, arbol, rango, plantillas }) => {
        this.origenesArbol = arbolEgreso ?? [];
        this.arbolCompleto = (arbol?.length ? arbol : arbolEgreso) ?? [];
        this.plantillas = plantillas ?? [];
        this.ventasSinCortePorMetodo = mapVentasSinCortePorMetodo(rango?.ventasTipo);
        this.aplicarOrigenPredeterminado();
        this.reintentarMatch$.next();
      },
      error: () => {
        this.origenesArbol = [];
        this.arbolCompleto = [];
        this.ventasSinCortePorMetodo = new Map();
      }
    });
  }

  private aplicarOrigenPredeterminado(): void {
    if (this.formalizarData) {
      return;
    }
    const actual = this.form.get('origenCuentaId')?.value as number | null;
    if (actual != null) {
      return;
    }
    const cajaEfectivo =
      this.origenesArbol.find(
        (o) =>
          (o.esRaiz || o.nivel === 0) &&
          (o.metodoPagoId === 1 ||
            /^caja\s*:?\s*efectivo$/i.test((o.nombre || '').trim()))
      ) ??
      this.origenesArbol.find((o) => o.esRaiz || o.nivel === 0) ??
      this.origenesArbol[0];
    if (cajaEfectivo) {
      this.form.patchValue({ origenCuentaId: cajaEfectivo.id }, { emitEvent: true });
    }
  }

  saldoParcial(item: OrigenFondosArbolItemDto): number {
    return saldoOrigenConVentasSinCorte(item, this.ventasSinCortePorMetodo).parcial;
  }

  etiquetaOrigen(item: OrigenFondosArbolItemDto): string {
    return etiquetaOrigenConSaldo(
      item,
      (n) => this.formatSaldo(n),
      this.saldoParcial(item)
    );
  }

  formatSaldo(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  private loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (prov) => {
        this.proveedores = prov;
        this.patchProveedorAfterLoad();
      }
    });
  }

  private patchProveedorAfterLoad() {
    const formalizar = this.formalizarData;
    if (formalizar) {
      const nombre = (formalizar.terceroNombre ?? '').trim();
      if (!nombre || this.proveedores.length === 0) {
        if (nombre) {
          this.form.patchValue({ proveedor: nombre }, { emitEvent: true });
        }
        return;
      }
      const match = this.proveedores.find(
        (p) => p.nombre.toLowerCase() === nombre.toLowerCase()
      );
      if (match) {
        this.form.patchValue({ proveedor: match }, { emitEvent: false });
      } else {
        this.form.patchValue({ proveedor: nombre }, { emitEvent: true });
      }
      return;
    }
    const egreso = this.egresoData;
    if (!egreso?.proveedor?.id) return;
    const prov = this.proveedores.find((p) => p.id === egreso.proveedor?.id);
    if (prov) this.form.patchValue({ proveedor: prov }, { emitEvent: false });
  }

  private filterProveedores(value: ProveedorDto | string | null): ProveedorDto[] {
    if (typeof value === 'object' && value !== null) return [...this.proveedores];
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : '';
    if (!filterValue) return [...this.proveedores];
    return this.proveedores.filter((p) => p.nombre.toLowerCase().includes(filterValue));
  }

  displayProveedor(prov: ProveedorDto | null): string {
    return prov ? prov.nombre : '';
  }

  onProveedorKeydown(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter') return;

    const value = this.form.get('proveedor')?.value;
    if (typeof value === 'object' && value !== null) return;

    const inputValue = typeof value === 'string' ? value.trim() : '';
    if (!inputValue) return;

    const exact = this.proveedores.find(
      (p) => p.nombre.toLowerCase() === inputValue.toLowerCase()
    );
    if (exact) {
      ke.preventDefault();
      ke.stopPropagation();
      this.form.patchValue({ proveedor: exact });
      return;
    }

    if (this.filterProveedores(value).length === 0) {
      ke.preventDefault();
      ke.stopPropagation();
      this.crearProveedorDesdeBoton();
    }
  }

  crearProveedorDesdeBoton(): void {
    this.openNuevoProveedor();
  }

  openNuevoProveedor(event?: Event) {
    if (event) {
      event.stopPropagation();
      (event as KeyboardEvent)?.preventDefault?.();
    }
    const valor = this.form.get('proveedor')?.value;
    const initialNombre =
      typeof valor === 'string' && valor?.trim() ? valor.trim() : undefined;
    const proveedorDialogRef = this.dialog.open(ProveedorEditComponent, {
      width: '500px',
      data: initialNombre ? { initialNombre } : null
    });
    proveedorDialogRef.afterClosed().subscribe((result: ProveedorDto | undefined) => {
      if (result) {
        this.proveedores = [...this.proveedores, result];
        this.form.patchValue({ proveedor: result });
      }
    });
  }

  ngAfterViewInit() {
    this.dialogRef.afterOpened().subscribe(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.setInitialFocus();
          this.setupDrag();
        }, 50);
      });
    });
  }

  private setupDrag() {
    const overlayElement = document.querySelector('.cdk-overlay-pane');
    if (overlayElement) {
      (overlayElement as HTMLElement).style.position = 'relative';
    }
  }

  onValorFocus(event: FocusEvent): void {
    this.valorEditando = true;
    const numeric = this.parseCurrency(this.form.get('valor')?.value);
    this.form.get('valor')!.setValue(String(numeric), { emitEvent: false });
    const input = event.target as HTMLInputElement;
    requestAnimationFrame(() => input.select());
  }

  onValorInput(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/[^\d]/g, '');
    this.form.get('valor')!.setValue(digits, { emitEvent: true });
  }

  onValorBlur(): void {
    this.valorEditando = false;
    const numeric = this.parseCurrency(this.form.get('valor')?.value);
    this.form.get('valor')!.setValue(this.formatValorDisplay(numeric), { emitEvent: true });
  }

  formatValorDisplay(value: number | null | undefined): string {
    return this.valorDisplayFormatter.format(Number(value ?? 0));
  }

  formatValorPreview(value: number | null | undefined): string {
    return this.valorPreviewFormatter.format(Number(value ?? 0));
  }

  private parseCurrency(value: string | number | null | undefined): number {
    const digits = String(value ?? '')
      .replace(/\s+/g, '')
      .replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }

  private validarValorMonto(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      return { required: true };
    }
    if (this.parseCurrency(raw) < 0) {
      return { min: true };
    }
    return null;
  }

  private setInitialFocus() {
    try {
      this.fechaInput?.nativeElement?.focus({ preventScroll: true });
    } catch (e) {
      console.debug('Focus management skipped:', e);
    }
  }

  get isEditMode(): boolean {
    const egreso = this.egresoData;
    return !!(egreso && egreso.id && egreso.id !== 0);
  }

  get dialogTitle(): string {
    if (this.formalizarData || this.movimientoPagoLinea) {
      return 'Formalizar egreso';
    }
    return this.isEditMode ? 'Editar egreso' : 'Nuevo egreso';
  }

  get buttonLabel(): string {
    if (this.formalizarData || this.movimientoPagoLinea) {
      return 'Formalizar egreso';
    }
    return this.isEditMode ? 'Actualizar egreso' : 'Registrar egreso';
  }

  save() {
    if (this.submitDisabled) return;
    if (this.form.invalid) return;

    const form = this.form.getRawValue();
    const prov = form.proveedor as ProveedorDto;
    if (!prov || typeof prov !== 'object' || !prov.id) {
      this.snackBar.open('Seleccione o cree un proveedor', 'Cerrar', { duration: 4000 });
      return;
    }

    const formalizar = this.formalizarData;
    const pagoLinea = this.movimientoPagoLinea;
    const origenId =
      formalizar?.origenFondosId ??
      pagoLinea?.origenFondosId ??
      (form.origenCuentaId as number | null) ??
      this.origenSeleccionado?.id ??
      null;
    const origen =
      this.origenesArbol.find((o) => o.id === origenId) ??
      this.arbolCompleto.find((o) => o.id === origenId) ??
      this.origenSeleccionado;
    if (origenId == null) {
      this.snackBar.open('Seleccione el origen del egreso', 'Cerrar', { duration: 4000 });
      return;
    }

    const fechaValue = form.fecha as Date | null;
    const fechaStr = fechaValue
      ? `${fechaValue.getFullYear()}-${String(fechaValue.getMonth() + 1).padStart(2, '0')}-${String(fechaValue.getDate()).padStart(2, '0')}`
      : '';

    const fromMovId =
      formalizar?.fromMovimientoOrigenFondosId ?? pagoLinea?.id ?? null;

    const request: CreateEgresoRequest = {
      fecha: fechaStr,
      valor: this.parseCurrency(form.valor),
      descripcion: form.descripcion || '',
      metodoPagoId: origen?.metodoPagoId ?? null,
      origenFondosId: origenId,
      proveedor: { id: prov.id },
      ...(fromMovId != null ? { fromMovimientoOrigenFondosId: fromMovId } : {})
    };

    const onError = (err: { error?: { message?: string }; message?: string }) => {
      const msg = err?.error?.message || err?.message || 'Error desconocido';
      this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
    };

    if (this.isEditMode) {
      this.egresosService.updateEgreso(this.egresoData!.id, request).subscribe({
        next: (result) => this.dialogRef.close({ ...result, _edit: true }),
        error: onError
      });
    } else {
      this.egresosService.createEgreso(request).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: onError
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
