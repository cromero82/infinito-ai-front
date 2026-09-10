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
  FormalizarEgresoDialogData,
  EgresoOrigenDto
} from '../service/egresos.service';
import { AsociarNotificacionEgresoDialogComponent } from '../asociar-notificacion-egreso-dialog.component';
import {
  ProveedorService,
  ProveedorDto
} from '../../proveedores/service/proveedor.service';
import {
  TipoEgresoService,
  TipoEgresoDto
} from '../service/tipo-egreso.service';
import {
  naturalezaCodigoFromTipo,
  NATURALEZAS_EGRESO_FALLBACK,
  NaturalezaEgreso,
  esNaturalezaPersona
} from '../util/naturaleza-egreso.util';
import {
  NaturalezaTipoEgresoDto,
  NaturalezaTipoEgresoService
} from '../service/naturaleza-tipo-egreso.service';
import {
  PersonaDto,
  PersonaService
} from '../service/persona.service';
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
  ConfigurationService,
  KEY_ASOCIACIONES_EGRESOS_OBLIGATORIO
} from '../../../../../auth/service/configuration.service';
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
  personas: PersonaDto[] = [];
  tiposEgreso: TipoEgresoDto[] = [];
  naturalezasOptions: Array<{ value: string; label: string }> = [...NATURALEZAS_EGRESO_FALLBACK];
  get naturalezas() {
    return this.naturalezasOptions;
  }
  origenesArbol: OrigenFondosArbolItemDto[] = [];
  /** Árbol completo (incluye hijos) para cruzar plantillas destino ↔ padre. */
  private arbolCompleto: OrigenFondosArbolItemDto[] = [];
  /** Solo OF con visibleEnEgreso (sin Cuenta del dueño). */
  private origenesArbolBase: OrigenFondosArbolItemDto[] = [];
  private plantillas: PlantillaNotificacionPagoDto[] = [];
  modoEstricto = false;
  private ventasSinCortePorMetodo = new Map<number, number>();
  filteredProveedores$!: Observable<ProveedorDto[]>;
  filteredPersonas$!: Observable<PersonaDto[]>;
  mostrarBotonCrearProveedor$!: Observable<boolean>;
  valorEditando = false;
  /** Evita pisar naturaleza/tipo elegidos a mano al cambiar proveedor. */
  private aplicandoDefaultTipo = false;

  get esBeneficiarioPersona(): boolean {
    return esNaturalezaPersona(this.form?.get('naturaleza')?.value);
  }

  /**
   * Pago QR / plantilla: el OF elegido tiene bolsa hija destino → no egresar del padre
   * hasta identificar el movimiento en la bolsa.
   */
  requiereMatchPagoLinea = false;
  buscandoMatchPagoLinea = false;
  movimientoPagoLinea: MovimientoOrigenFondosDto | null = null;
  mensajePagoLinea: string | null = null;
  /**
   * configuracion_app `notificaciones.asociaciones-egresos.obligatorio`.
   * true = no registrar QR/plantilla sin movimiento identificado.
   */
  asociacionEgresoObligatoria = true;
  /** Observación autollenada desde el movimiento match (para no pisar edición manual). */
  private descripcionAutoPagoLinea: string | null = null;
  /** OF del select que disparó el match de pago en línea (el padre QR/banco). */
  private pagoLineaOrigenPadreId: number | null = null;
  /** Montos por origen cuando hay 2+ seleccionados. El último es el restante. */
  private readonly origenMontos = new Map<number, string>();
  montoOrigenEditandoId: number | null = null;

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
    private personaService: PersonaService,
    private tipoEgresoService: TipoEgresoService,
    private naturalezaTipoEgresoService: NaturalezaTipoEgresoService,
    private origenFondosService: OrigenFondosService,
    private movimientoOrigenFondosService: MovimientoOrigenFondosService,
    private notificacionesMediosService: GestionNotificacionesMediosService,
    private corteVentaService: CorteVentaService,
    private establecimientoService: EstablecimientoService,
    private configurationService: ConfigurationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fechaUtilService: FechaUtilService
  ) {
    this.form = this.fb.group({
      fecha: [new Date() as Date | null, Validators.required],
      valor: ['', [Validators.required, this.validarValorMonto.bind(this)]],
      descripcion: [''],
      proveedor: [null as ProveedorDto | string | null],
      persona: [null as PersonaDto | string | null],
      origenCuentaIds: [[] as number[], this.requireOrigenes.bind(this)],
      tipoEgresoId: [null as number | null, Validators.required],
      naturaleza: [null as string | null, Validators.required]
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

  get origenIdsSeleccionados(): number[] {
    const raw = this.form.get('origenCuentaIds')?.value;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }

  get origenSeleccionado(): OrigenFondosArbolItemDto | undefined {
    const ids = this.origenIdsSeleccionados;
    if (ids.length !== 1) {
      return undefined;
    }
    return this.origenesArbol.find((o) => o.id === ids[0]);
  }

  get origenesTriggerLabel(): string {
    const ids = this.origenIdsSeleccionados;
    if (!ids.length) {
      return '';
    }
    return ids.map((id) => this.nombreCortoOrigenPorId(id)).join(', ');
  }

  get mostrarMontosOrigen(): boolean {
    return this.origenIdsSeleccionados.length > 1 && !this.formalizarData;
  }

  get valorEgresoNumero(): number {
    return this.parseCurrency(this.form.get('valor')?.value);
  }

  get origenesPagoRows(): Array<{
    id: number;
    nombre: string;
    monto: string;
  }> {
    const ids = this.origenIdsSeleccionados;
    return ids.map((id) => ({
      id,
      nombre: this.nombreCortoOrigenPorId(id),
      monto: this.origenMontos.get(id) ?? this.formatValorDisplay(0)
    }));
  }

  get origenesMontosValidos(): boolean {
    const ids = this.origenIdsSeleccionados;
    if (!ids.length) {
      return false;
    }
    if (ids.length === 1) {
      return true;
    }
    const total = this.valorEgresoNumero;
    let sum = 0;
    for (const id of ids) {
      const v = this.parseCurrency(this.origenMontos.get(id));
      if (v <= 0) {
        return false;
      }
      sum += v;
    }
    return sum === total;
  }

  get advertenciaSaldoOrigen(): string | null {
    if (this.modoEstricto || this.isFormalizarMode) {
      return null;
    }
    const ids = this.origenIdsSeleccionados;
    const total = this.valorEgresoNumero;
    if (!ids.length || total <= 0) {
      return null;
    }
    const msgs: string[] = [];
    for (const id of ids) {
      const origen = this.origenesArbol.find((o) => o.id === id);
      if (!origen) {
        continue;
      }
      const valor = ids.length === 1 ? total : this.parseCurrency(this.origenMontos.get(id));
      if (valor <= 0) {
        continue;
      }
      const saldo = this.saldoParcial(origen);
      if (saldo < valor) {
        msgs.push(
          `Saldo parcial insuficiente en «${origen.nombre}» (${this.formatSaldo(saldo)}). Se permitirá en modo flexible.`
        );
      } else if (saldo === 0) {
        msgs.push(`«${origen.nombre}» está en $0 (total parcial). Revise antes de egresar.`);
      }
    }
    return msgs.length ? msgs.join(' ') : null;
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
    if (!this.origenesMontosValidos) {
      return true;
    }
    if (this.formalizarData || this.isEditMode) {
      return false;
    }
    if (
      this.asociacionEgresoObligatoria &&
      this.requiereMatchPagoLinea &&
      !this.movimientoPagoLinea
    ) {
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
    this.asociacionEgresoObligatoria =
      this.configurationService.isAsociacionesEgresosObligatorio();
    this.configurationService
      .obtenerValorPorKey(KEY_ASOCIACIONES_EGRESOS_OBLIGATORIO)
      .subscribe({
        next: () => {
          this.asociacionEgresoObligatoria =
            this.configurationService.isAsociacionesEgresosObligatorio();
        }
      });
    this.loadProveedores();
    this.loadPersonas();
    this.loadTiposEgreso();
    this.loadOrigenesArbol();
    this.syncBeneficiarioValidators();

    this.filteredProveedores$ = this.form.get('proveedor')!.valueChanges.pipe(
      startWith(this.form.get('proveedor')!.value),
      map((value) => this.filterProveedores(value))
    );

    this.filteredPersonas$ = this.form.get('persona')!.valueChanges.pipe(
      startWith(this.form.get('persona')!.value),
      map((value) => this.filterPersonas(value))
    );

    this.form
      .get('proveedor')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((prov) => {
        if (typeof prov === 'object' && prov !== null && (prov as ProveedorDto).id) {
          this.aplicarDefaultDesdeProveedor(prov as ProveedorDto);
        }
      });

    this.form
      .get('tipoEgresoId')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tipoId) => {
        if (this.aplicandoDefaultTipo || tipoId == null) {
          return;
        }
        const tipo = this.tiposEgreso.find((t) => t.id === Number(tipoId));
        const codigo = naturalezaCodigoFromTipo(tipo);
        if (codigo) {
          this.form.patchValue({ naturaleza: codigo }, { emitEvent: true });
        }
      });

    this.form
      .get('valor')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcularRestante());

    this.form
      .get('naturaleza')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncBeneficiarioValidators();
        this.refreshOrigenesDisponibles();
      });

    this.form
      .get('persona')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshOrigenesDisponibles());

    this.mostrarBotonCrearProveedor$ = this.filteredProveedores$.pipe(
      combineLatestWith(
        this.form.get('proveedor')!.valueChanges.pipe(startWith(this.form.get('proveedor')!.value))
      ),
      map(([filtered, value]) => {
        if (this.esBeneficiarioPersona) {
          return false;
        }
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
        origenCuentaIds: [formalizar.origenFondosId],
        descripcion: formalizar.terceroNombre
          ? `Pago ${formalizar.terceroNombre}`
          : ''
      });
      this.form.get('origenCuentaIds')?.disable({ emitEvent: false });
      this.patchProveedorAfterLoad();
    } else if (egreso) {
      const prov = egreso.proveedor;
      const per = egreso.persona;
      this.form.patchValue({
        fecha: egreso.fecha
          ? this.fechaUtilService.parseDateAsLocal(egreso.fecha)
          : null,
        valor: this.formatValorDisplay(egreso.valor ?? 0),
        descripcion: egreso.descripcion || '',
        proveedor: prov
          ? { id: prov.id, nombre: prov.nombre, tipoEgreso: prov.tipoEgreso }
          : null,
        persona: per
          ? {
              id: per.id,
              documento: per.documento || '',
              nombre: per.nombre || '',
              esDuenoPropietario: !!(per as { esDuenoPropietario?: boolean })
                .esDuenoPropietario
            }
          : null,
        origenCuentaIds: this.idsOrigenDesdeEgreso(egreso),
        tipoEgresoId:
          egreso.tipoEgreso?.id ?? egreso.proveedor?.tipoEgreso?.id ?? null,
        naturaleza:
          egreso.naturaleza ??
          naturalezaCodigoFromTipo(egreso.tipoEgreso) ??
          naturalezaCodigoFromTipo(egreso.proveedor?.tipoEgreso)
      });
      this.syncBeneficiarioValidators();
      this.cargarMontosDesdeEgreso(egreso);
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
    const origen$ = this.form.get('origenCuentaIds')!.valueChanges.pipe(
      startWith(this.form.get('origenCuentaIds')!.value),
      map((ids) => (Array.isArray(ids) ? ids.map((id) => Number(id)).join(',') : '')),
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
          const ids = this.origenIdsSeleccionados;
          const total = this.parseCurrency(this.form.get('valor')?.value);
          let origenMatchId: number | null = null;
          let bolsas: number[] = [];
          let valorMatch = total;
          for (const origenId of ids) {
            const dest = this.bolsasDestinoPlantilla(origenId);
            if (dest.length) {
              origenMatchId = origenId;
              bolsas = dest;
              valorMatch =
                ids.length === 1
                  ? total
                  : this.parseCurrency(this.origenMontos.get(origenId));
              break;
            }
          }

          if (!origenMatchId || !(valorMatch > 0) || bolsas.length === 0) {
            this.requiereMatchPagoLinea = false;
            this.buscandoMatchPagoLinea = false;
            this.pagoLineaOrigenPadreId = null;
            this.limpiarMatchPagoLinea();
            return of(null);
          }

          this.requiereMatchPagoLinea = true;
          this.buscandoMatchPagoLinea = true;
          this.pagoLineaOrigenPadreId = origenMatchId;
          if (!this.movimientoPagoLinea) {
            this.mensajePagoLinea = this.asociacionEgresoObligatoria
              ? 'Buscando / Esperando el movimiento del pago en línea (mismo valor en la bolsa destino de la plantilla)…'
              : 'Buscando notificación de pago (mismo valor). Si no aparece, puede registrar el egreso; saldrá del origen seleccionado.';
          }

          return this.buscarCandidatosPagoLinea(bolsas, valorMatch).pipe(
            tap((list) => this.aplicarCandidatosPagoLinea(list, origenMatchId!))
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
      this.mensajePagoLinea = this.asociacionEgresoObligatoria
        ? 'Buscando / Esperando el movimiento del pago en línea (mismo valor en la bolsa destino de la plantilla). El registro permanece deshabilitado hasta identificarlo.'
        : 'No hay notificación de pago para este valor. Puede registrar el egreso; saldrá del origen seleccionado (no de una bolsa por identificar).';
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
        this.origenesArbolBase = arbolEgreso ?? [];
        this.arbolCompleto = (arbol?.length ? arbol : arbolEgreso) ?? [];
        this.plantillas = plantillas ?? [];
        this.ventasSinCortePorMetodo = mapVentasSinCortePorMetodo(rango?.ventasTipo);
        this.refreshOrigenesDisponibles();
        this.aplicarOrigenPredeterminado();
        this.reintentarMatch$.next();
      },
      error: () => {
        this.origenesArbol = [];
        this.origenesArbolBase = [];
        this.arbolCompleto = [];
        this.ventasSinCortePorMetodo = new Map();
      }
    });
  }

  /**
   * Une Cuenta del dueño al select solo si PERSONAL/DIVIDENDOS + persona dueño/propietario.
   */
  private refreshOrigenesDisponibles(): void {
    const base = [...(this.origenesArbolBase || [])];
    const ids = new Set(base.map((o) => o.id));
    if (this.puedeUsarCuentaDelDueno()) {
      for (const c of this.findCuentasDelDuenoEnArbol()) {
        if (!ids.has(c.id)) {
          base.push(c);
          ids.add(c.id);
        }
      }
    }
    this.origenesArbol = base;
    const seleccionados = this.origenIdsSeleccionados;
    const filtered = seleccionados.filter((id) => ids.has(id));
    if (filtered.length !== seleccionados.length) {
      this.form.patchValue({ origenCuentaIds: filtered }, { emitEvent: false });
      this.syncMontosOrigenes(filtered);
    }
  }

  private puedeUsarCuentaDelDueno(): boolean {
    if (!esNaturalezaPersona(this.form.get('naturaleza')?.value)) {
      return false;
    }
    const per = this.form.get('persona')?.value;
    return (
      typeof per === 'object' &&
      per != null &&
      !!(per as PersonaDto).id &&
      !!(per as PersonaDto).esDuenoPropietario
    );
  }

  private findCuentasDelDuenoEnArbol(): OrigenFondosArbolItemDto[] {
    return (this.arbolCompleto || []).filter((c) => this.esCuentaDelDuenoOf(c));
  }

  private esCuentaDelDuenoOf(c: OrigenFondosArbolItemDto): boolean {
    if (!c?.parentOrigenFondosId) {
      return false;
    }
    const codigo = (c.tipoOrigenFondosCodigo || '').trim().toUpperCase();
    if (codigo === 'DUENOS') {
      return true;
    }
    const padre = this.arbolCompleto.find((p) => p.id === c.parentOrigenFondosId);
    if ((padre?.tipoOrigenFondosCodigo || '').trim().toUpperCase() === 'DUENOS') {
      return true;
    }
    const nombre = (c.nombre || '').trim().toLowerCase();
    return (
      nombre === 'cuenta del dueño' ||
      nombre === 'cuenta del dueno' ||
      nombre === 'personal administrador' ||
      nombre.includes('cuenta del due')
    );
  }

  private aplicarOrigenPredeterminado(): void {
    if (this.formalizarData) {
      return;
    }
    const actual = this.origenIdsSeleccionados;
    if (actual.length) {
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
      this.form.patchValue({ origenCuentaIds: [cajaEfectivo.id] }, { emitEvent: true });
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

  private loadPersonas() {
    this.personaService.getAll(true).subscribe({
      next: (list) => {
        this.personas = list || [];
      }
    });
  }

  /** PERSONAL/DIVIDENDOS → persona requerida; resto → proveedor. */
  private syncBeneficiarioValidators(): void {
    const proveedorCtrl = this.form.get('proveedor');
    const personaCtrl = this.form.get('persona');
    if (!proveedorCtrl || !personaCtrl) {
      return;
    }
    if (esNaturalezaPersona(this.form.get('naturaleza')?.value)) {
      proveedorCtrl.clearValidators();
      proveedorCtrl.setValue(null, { emitEvent: false });
      personaCtrl.setValidators([Validators.required]);
    } else {
      personaCtrl.clearValidators();
      personaCtrl.setValue(null, { emitEvent: false });
      proveedorCtrl.setValidators([Validators.required]);
    }
    proveedorCtrl.updateValueAndValidity({ emitEvent: false });
    personaCtrl.updateValueAndValidity({ emitEvent: false });
    this.refreshOrigenesDisponibles();
  }

  private loadTiposEgreso() {
    this.tipoEgresoService.getTiposEgreso().subscribe({
      next: (tipos) => {
        this.tiposEgreso = tipos || [];
      }
    });
    this.naturalezaTipoEgresoService.getAll(true).subscribe({
      next: (nats: NaturalezaTipoEgresoDto[]) => {
        if (nats?.length) {
          this.naturalezasOptions = nats.map((n) => ({
            value: n.codigo,
            label: n.nombre
          }));
        }
      }
    });
  }

  private aplicarDefaultDesdeProveedor(prov: ProveedorDto): void {
    if (this.isEditMode) {
      return;
    }
    const tipoId = prov.tipoEgreso?.id ?? null;
    if (tipoId == null) {
      return;
    }
    this.aplicandoDefaultTipo = true;
    const tipo =
      this.tiposEgreso.find((t) => t.id === tipoId) ||
      (prov.tipoEgreso as TipoEgresoDto | undefined);
    const naturaleza = (naturalezaCodigoFromTipo(tipo) || null) as NaturalezaEgreso | null;
    this.form.patchValue(
      {
        tipoEgresoId: tipoId,
        ...(naturaleza ? { naturaleza } : {})
      },
      { emitEvent: false }
    );
    this.aplicandoDefaultTipo = false;
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
        this.aplicarDefaultDesdeProveedor(match);
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

  private filterPersonas(value: PersonaDto | string | null): PersonaDto[] {
    if (typeof value === 'object' && value !== null) return [...this.personas];
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : '';
    if (!filterValue) return [...this.personas];
    return this.personas.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(filterValue) ||
        (p.documento || '').toLowerCase().includes(filterValue)
    );
  }

  displayProveedor(prov: ProveedorDto | null): string {
    return prov ? prov.nombre : '';
  }

  displayPersona(per: PersonaDto | null): string {
    if (!per) {
      return '';
    }
    return per.documento ? `${per.nombre} (${per.documento})` : per.nombre;
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

  onOrigenesSelection(ids: number[] | null): void {
    this.syncMontosOrigenes(Array.isArray(ids) ? ids : []);
  }

  onMontoOrigenFocus(origenId: number, event: FocusEvent): void {
    this.montoOrigenEditandoId = origenId;
    const numeric = this.parseCurrency(this.origenMontos.get(origenId));
    this.origenMontos.set(origenId, String(numeric));
    const input = event.target as HTMLInputElement;
    input.value = String(numeric);
    requestAnimationFrame(() => input.select());
  }

  onMontoOrigenInput(origenId: number, event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/[^\d]/g, '');
    this.origenMontos.set(origenId, digits);
    (event.target as HTMLInputElement).value = digits;
    this.recalcularRestante(origenId);
  }

  onMontoOrigenBlur(origenId: number): void {
    this.montoOrigenEditandoId = null;
    const numeric = this.parseCurrency(this.origenMontos.get(origenId));
    this.origenMontos.set(origenId, this.formatValorDisplay(numeric));
    this.recalcularRestante(origenId);
  }

  private requireOrigenes(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    return Array.isArray(v) && v.length > 0 ? null : { required: true };
  }

  private idsOrigenDesdeEgreso(egreso: EgresoDto): number[] {
    if (egreso.origenes?.length) {
      return [...egreso.origenes]
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((o) => o.origenFondosId)
        .filter((id) => id != null);
    }
    return egreso.origenFondosId != null ? [egreso.origenFondosId] : [];
  }

  private cargarMontosDesdeEgreso(egreso: EgresoDto): void {
    const lineas = egreso.origenes ?? [];
    this.origenMontos.clear();
    if (lineas.length > 1) {
      for (const linea of lineas) {
        this.origenMontos.set(
          linea.origenFondosId,
          this.formatValorDisplay(linea.valor)
        );
      }
    }
  }

  private syncMontosOrigenes(ids: number[]): void {
    const keep = new Set(ids);
    for (const key of [...this.origenMontos.keys()]) {
      if (!keep.has(key)) {
        this.origenMontos.delete(key);
      }
    }
    if (ids.length <= 1) {
      this.origenMontos.clear();
      return;
    }
    for (const id of ids) {
      if (!this.origenMontos.has(id)) {
        this.origenMontos.set(id, this.formatValorDisplay(0));
      }
    }
    this.recalcularRestante();
  }

  /**
   * El restante del total va a otro origen: si se edita el último, al primero;
   * en cualquier otro caso (o al cambiar el valor del egreso), al último.
   */
  private recalcularRestante(origenEditadoId?: number | null): void {
    const ids = this.origenIdsSeleccionados;
    if (ids.length <= 1) {
      return;
    }
    const lastId = ids[ids.length - 1];
    const sinkId =
      origenEditadoId != null && origenEditadoId === lastId ? ids[0] : lastId;
    let assigned = 0;
    for (const id of ids) {
      if (id !== sinkId) {
        assigned += this.parseCurrency(this.origenMontos.get(id));
      }
    }
    const restante = this.valorEgresoNumero - assigned;
    this.origenMontos.set(sinkId, this.formatValorDisplay(restante));
  }

  private nombreCortoOrigenPorId(id: number): string {
    const op =
      this.origenesArbol.find((o) => o.id === id) ??
      this.arbolCompleto.find((o) => o.id === id);
    if (!op) {
      return `#${id}`;
    }
    return (op.nombreDisplay || op.nombre || '')
      .replace(/^[─\s]+/, '')
      .trim() || op.nombre || `#${id}`;
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

  get puedeAsociarNotificacion(): boolean {
    const e = this.egresoData;
    return (
      this.isEditMode &&
      !!e &&
      e.notificacionEmailPagoId == null &&
      e.fromMovimientoOrigenFondosId == null
    );
  }

  abrirAsociarNotificacion(): void {
    const e = this.egresoData;
    if (!e?.id || !this.puedeAsociarNotificacion) {
      return;
    }
    const ref = this.dialog.open(AsociarNotificacionEgresoDialogComponent, {
      width: '480px',
      data: {
        egresoId: e.id,
        valor: e.valor,
        fecha: e.fecha
      }
    });
    ref.afterClosed().subscribe((updated) => {
      if (!updated) {
        return;
      }
      e.notificacionEmailPagoId = updated.id;
      this.snackBar.open(
        `Notificación #${updated.id} asociada a este egreso`,
        'Cerrar',
        { duration: 3000 }
      );
    });
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
    const naturaleza = form.naturaleza as NaturalezaEgreso;
    const usaPersona = esNaturalezaPersona(naturaleza);

    let proveedorPayload: { id: number } | null = null;
    let personaPayload: { id: number } | null = null;

    if (usaPersona) {
      const per = form.persona as PersonaDto;
      if (!per || typeof per !== 'object' || !per.id) {
        this.snackBar.open('Seleccione una persona beneficiaria', 'Cerrar', {
          duration: 4000
        });
        return;
      }
      personaPayload = { id: per.id };
    } else {
      const prov = form.proveedor as ProveedorDto;
      if (!prov || typeof prov !== 'object' || !prov.id) {
        this.snackBar.open('Seleccione o cree un proveedor', 'Cerrar', {
          duration: 4000
        });
        return;
      }
      proveedorPayload = { id: prov.id };
    }

    const formalizar = this.formalizarData;
    const pagoLinea = this.movimientoPagoLinea;
    const ids = this.origenIdsSeleccionados;
    if (!ids.length) {
      this.snackBar.open('Seleccione el origen del egreso', 'Cerrar', { duration: 4000 });
      return;
    }
    if (!this.origenesMontosValidos) {
      this.snackBar.open(
        'Indique el valor de cada origen; deben sumar el total del egreso',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    const total = this.parseCurrency(form.valor);
    const origenes: EgresoOrigenDto[] = ids.map((id) => {
      let ofId = id;
      if (formalizar) {
        ofId = formalizar.origenFondosId;
      } else if (
        pagoLinea?.origenFondosId != null &&
        this.pagoLineaOrigenPadreId === id
      ) {
        ofId = pagoLinea.origenFondosId;
      }
      const valor = ids.length === 1 ? total : this.parseCurrency(this.origenMontos.get(id));
      return { origenFondosId: ofId, valor };
    });
    const origenId = origenes[0].origenFondosId;
    const origen =
      this.origenesArbol.find((o) => o.id === origenId) ??
      this.arbolCompleto.find((o) => o.id === origenId);

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
      origenes,
      proveedor: proveedorPayload,
      persona: personaPayload,
      tipoEgreso: { id: Number(form.tipoEgresoId) },
      naturaleza,
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
