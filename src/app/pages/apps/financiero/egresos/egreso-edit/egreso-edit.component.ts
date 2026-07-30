import {
  Component,
  Inject,
  OnInit,
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
import { AsyncPipe } from '@angular/common';
import { Observable, forkJoin, of } from 'rxjs';
import { map, startWith, combineLatestWith, catchError } from 'rxjs/operators';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  EgresosService,
  EgresoDto,
  CreateEgresoRequest
} from '../service/egresos.service';
import {
  ProveedorService,
  ProveedorDto
} from '../../proveedores/service/proveedor.service';
import { ProveedorEditComponent } from '../../proveedores/proveedor-edit/proveedor-edit.component';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';
import { OrigenFondosService } from '../../origenes-fondos/service/origen-fondos.service';
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
    AsyncPipe,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './egreso-edit.component.html',
  styleUrl: './egreso-edit.component.scss'
})
export class EgresoEditComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  proveedores: ProveedorDto[] = [];
  origenesArbol: OrigenFondosArbolItemDto[] = [];
  modoEstricto = false;
  /** Ventas sin corte por metodoPagoId (mismo cálculo que Orígenes de fondos). */
  private ventasSinCortePorMetodo = new Map<number, number>();
  filteredProveedores$!: Observable<ProveedorDto[]>;
  mostrarBotonCrearProveedor$!: Observable<boolean>;
  valorEditando = false;

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
    @Inject(MAT_DIALOG_DATA) public data: EgresoDto | null,
    private egresosService: EgresosService,
    private proveedorService: ProveedorService,
    private origenFondosService: OrigenFondosService,
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

  get origenSeleccionado(): OrigenFondosArbolItemDto | undefined {
    const id = this.form.get('origenCuentaId')?.value as number | null;
    return this.origenesArbol.find((o) => o.id === id);
  }

  get advertenciaSaldoOrigen(): string | null {
    if (this.modoEstricto) {
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

    if (this.data) {
      const prov = this.data.proveedor;
      this.form.patchValue({
        fecha: this.data.fecha
          ? this.fechaUtilService.parseDateAsLocal(this.data.fecha)
          : null,
        valor: this.formatValorDisplay(this.data.valor ?? 0),
        descripcion: this.data.descripcion || '',
        proveedor: prov
          ? { id: prov.id, nombre: prov.nombre, tipoEgreso: prov.tipoEgreso }
          : null,
        origenCuentaId: this.data.origenFondosId ?? null
      });
      this.patchProveedorAfterLoad();
    } else {
      this.form.patchValue({ valor: this.formatValorDisplay(0) });
    }
  }

  private loadOrigenesArbol() {
    forkJoin({
      arbol: this.origenFondosService.findArbolParaEgreso(),
      rango: this.corteVentaService
        .consultarRango(paramsConsultarRangoHastaAhora())
        .pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ arbol, rango }) => {
        this.origenesArbol = arbol ?? [];
        this.ventasSinCortePorMetodo = mapVentasSinCortePorMetodo(
          rango?.ventasTipo
        );
        this.aplicarOrigenPredeterminado();
      },
      error: () => {
        this.origenesArbol = [];
        this.ventasSinCortePorMetodo = new Map();
      }
    });
  }

  private aplicarOrigenPredeterminado(): void {
    const actual = this.form.get('origenCuentaId')?.value as number | null;
    if (actual != null) {
      return;
    }
    const baseProveedores =
      this.origenesArbol.find((o) => o.metodoPagoId === 4 && o.esRaiz) ??
      this.origenesArbol.find((o) => o.esRaiz) ??
      this.origenesArbol[0];
    if (baseProveedores) {
      this.form.patchValue({ origenCuentaId: baseProveedores.id }, { emitEvent: false });
    }
  }

  saldoParcial(item: OrigenFondosArbolItemDto): number {
    return saldoOrigenConVentasSinCorte(item, this.ventasSinCortePorMetodo)
      .parcial;
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
    if (!this.data) return;
    const prov = this.proveedores.find((p) => p.id === this.data!.proveedor?.id);
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
    const digits = String(value ?? '').replace(/\s+/g, '').replace(/[^\d]/g, '');
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
    return !!(this.data && this.data.id && this.data.id !== 0);
  }

  get buttonLabel(): string {
    return this.isEditMode ? 'Actualizar egreso' : 'Registrar egreso';
  }

  save() {
    if (this.form.invalid) return;

    const form = this.form.value;
    const prov = form.proveedor as ProveedorDto;
    const origen = this.origenSeleccionado;
    if (!origen) {
      this.snackBar.open('Seleccione el origen del egreso', 'Cerrar', { duration: 4000 });
      return;
    }

    const fechaValue = form.fecha as Date | null;
    const fechaStr = fechaValue
      ? `${fechaValue.getFullYear()}-${String(fechaValue.getMonth() + 1).padStart(2, '0')}-${String(fechaValue.getDate()).padStart(2, '0')}`
      : '';

    const request: CreateEgresoRequest = {
      fecha: fechaStr,
      valor: this.parseCurrency(form.valor),
      descripcion: form.descripcion || '',
      metodoPagoId: origen.metodoPagoId ?? 0,
      origenFondosId: origen.id,
      proveedor: { id: prov.id }
    };

    const onError = (err: { error?: { message?: string }; message?: string }) => {
      const msg = err?.error?.message || err?.message || 'Error desconocido';
      this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
    };

    if (this.isEditMode) {
      this.egresosService.updateEgreso(this.data!.id, request).subscribe({
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
