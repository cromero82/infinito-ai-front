import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of, Subject } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import {
  ConfigurationService,
  KEY_CORTE_VENTA_BASE_EFECTIVO
} from '../../../../../auth/service/configuration.service';
import {
  CorteVentaService,
  DistribucionEfectivoPendienteDto
} from '../../../ventas/service/corte-venta.service';

export interface DistribucionEfectivoDialogData {
  pendiente: DistribucionEfectivoPendienteDto;
}

export interface DistribucionEfectivoDialogResult {
  confirmada: boolean;
  definirLuego?: boolean;
}

type MontoControl = 'base' | 'aCajaMenor' | 'aCajaGeneral';

@Component({
  selector: 'vex-distribucion-efectivo-dialog',
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    DragDropModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './distribucion-efectivo-dialog.component.html',
  styleUrl: './distribucion-efectivo-dialog.component.scss'
})
export class DistribucionEfectivoDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  guardando = false;
  readonly saldo: number;
  private baseOriginal = 0;
  private readonly destroy$ = new Subject<void>();
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  @ViewChild('baseInput') baseInput?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<
      DistribucionEfectivoDialogComponent,
      DistribucionEfectivoDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: DistribucionEfectivoDialogData,
    private corteVentaService: CorteVentaService,
    private configurationService: ConfigurationService,
    private snackBar: MatSnackBar
  ) {
    this.saldo = Number(data.pendiente.saldoCajaEfectivo ?? 0);
    this.form = this.fb.group({
      base: [this.formatCurrency(0), Validators.required],
      aCajaMenor: [this.formatCurrency(this.saldo), Validators.required],
      aCajaGeneral: [this.formatCurrency(0), Validators.required],
      observacion: ['']
    });
  }

  ngOnInit(): void {
    this.form
      .get('base')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcularMenor());
    this.form
      .get('aCajaGeneral')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcularMenor());
    this.form
      .get('aCajaMenor')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcularGeneral());
    this.cargarBaseSugerida();
    this.recalcularMenor();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Al enfocar: número plano y selección para reemplazar. */
  onMontoFocus(controlName: MontoControl, event: FocusEvent): void {
    const numeric = this.parseCurrency(this.form.get(controlName)!.value);
    this.form.get(controlName)!.setValue(String(numeric), { emitEvent: false });
    this.seleccionarContenido(event.target as HTMLInputElement);
  }

  onMontoBlur(controlName: MontoControl): void {
    const numeric = this.parseCurrency(this.form.get(controlName)!.value);
    this.form.get(controlName)!.setValue(this.formatCurrency(numeric), {
      emitEvent: false
    });
    this.redistribuirDesde(controlName);
  }

  onMontoInput(controlName: MontoControl, event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/[^\d]/g, '');
    this.form.get(controlName)!.setValue(digits, { emitEvent: true });
  }

  /** Selecciona todo el valor para reemplazarlo al escribir. */
  seleccionarContenido(input: HTMLInputElement | null | undefined): void {
    if (!input) {
      return;
    }
    input.focus();
    setTimeout(() => input.select(), 0);
  }

  focusYSeleccionarBase(): void {
    this.baseInput?.nativeElement?.focus();
  }

  get sumaValida(): boolean {
    const base = this.parseCurrency(this.form.get('base')!.value);
    const menor = this.parseCurrency(this.form.get('aCajaMenor')!.value);
    const general = this.parseCurrency(this.form.get('aCajaGeneral')!.value);
    return Math.round(base + menor + general) === Math.round(this.saldo)
      && menor >= 0
      && general >= 0;
  }

  private cargarBaseSugerida(): void {
    this.configurationService
      .obtenerBaseEfectivoSugerida()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ valor }) => {
          this.baseOriginal = valor;
          this.form
            .get('base')!
            .setValue(this.formatCurrency(valor), { emitEvent: false });
          this.recalcularMenor();
          setTimeout(() => this.focusYSeleccionarBase(), 0);
        },
        error: () => {
          this.baseOriginal = 0;
        }
      });
  }

  private redistribuirDesde(controlName: MontoControl): void {
    if (controlName === 'aCajaMenor') {
      this.recalcularGeneral();
      return;
    }
    this.recalcularMenor();
  }

  private recalcularMenor(): void {
    const base = this.parseCurrency(this.form.get('base')!.value);
    const general = this.parseCurrency(this.form.get('aCajaGeneral')!.value);
    const menor = this.saldo - base - general;
    this.form
      .get('aCajaMenor')!
      .setValue(this.formatCurrency(menor), { emitEvent: false });
  }

  private recalcularGeneral(): void {
    const base = this.parseCurrency(this.form.get('base')!.value);
    const menor = this.parseCurrency(this.form.get('aCajaMenor')!.value);
    const general = this.saldo - base - menor;
    this.form
      .get('aCajaGeneral')!
      .setValue(this.formatCurrency(general), { emitEvent: false });
  }

  confirmar(): void {
    if (!this.sumaValida || this.form.invalid) {
      this.snackBar.open(
        'Base + Caja Menor + Caja General debe igualar el saldo de Caja: Efectivo.',
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }
    const corteId = this.data.pendiente.corteVentaId;
    if (corteId == null) {
      return;
    }
    this.guardando = true;
    const raw = this.form.getRawValue();
    const base = this.parseCurrency(raw.base);
    const menor = this.parseCurrency(raw.aCajaMenor);
    const general = this.parseCurrency(raw.aCajaGeneral);
    this.persistirBaseSiCambio(base)
      .pipe(
        switchMap(() =>
          this.corteVentaService.confirmarDistribucionEfectivo(corteId, {
            base,
            montoCajaMenor: menor,
            montoCajaGeneral: general,
            observacion: (raw.observacion as string)?.trim() || undefined
          })
        ),
        takeUntil(this.destroy$),
        finalize(() => (this.guardando = false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Distribución de efectivo confirmada', undefined, {
            duration: 3000
          });
          this.dialogRef.close({ confirmada: true });
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.errores?.[0]?.descripcionError ||
            (this.baseCambio(base)
              ? 'No se pudo guardar la base en configuracion_app (corte-venta.base-efectivo).'
              : 'No se pudo confirmar la distribución.');
          this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
        }
      });
  }

  definirLuego(): void {
    this.dialogRef.close({ confirmada: false, definirLuego: true });
  }

  private persistirBaseSiCambio(base: number): Observable<unknown> {
    if (!this.baseCambio(base)) {
      return of(null);
    }
    return this.configurationService.actualizarPorKey(
      KEY_CORTE_VENTA_BASE_EFECTIVO,
      String(base)
    );
  }

  private baseCambio(base: number): boolean {
    return Math.round(base) !== Math.round(this.baseOriginal);
  }

  formatCurrency(value: number | null | undefined): string {
    return this.currencyFormatter.format(Number(value ?? 0)).replace('COP', '$').trim();
  }

  private parseCurrency(value: string | number | null | undefined): number {
    const raw = String(value ?? '').trim();
    const negative = raw.startsWith('-');
    const digits = raw.replace(/[^\d]/g, '');
    const numeric = digits ? Number(digits) : 0;
    return negative ? -numeric : numeric;
  }
}
