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
      base: [0, [Validators.required, Validators.min(0)]],
      aCajaMenor: [0, [Validators.required, Validators.min(0)]],
      aCajaGeneral: [{ value: this.saldo, disabled: true }],
      observacion: ['']
    });
  }

  ngOnInit(): void {
    this.form
      .get('base')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcularGeneral());
    this.form
      .get('aCajaMenor')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcularGeneral());
    this.cargarBaseSugerida();
    this.recalcularGeneral();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.seleccionarContenido(this.baseInput?.nativeElement);
  }

  get aCajaGeneral(): number {
    return Number(this.form.get('aCajaGeneral')!.value ?? 0);
  }

  get sumaValida(): boolean {
    const base = Number(this.form.get('base')!.value ?? 0);
    const menor = Number(this.form.get('aCajaMenor')!.value ?? 0);
    return Math.round(base + menor + this.aCajaGeneral) === Math.round(this.saldo)
      && this.aCajaGeneral >= 0;
  }

  private cargarBaseSugerida(): void {
    this.configurationService
      .obtenerBaseEfectivoSugerida()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ valor }) => {
          this.baseOriginal = valor;
          this.form.get('base')!.setValue(valor, { emitEvent: false });
          this.recalcularGeneral();
          setTimeout(() => this.focusYSeleccionarBase(), 0);
        },
        error: () => {
          this.baseOriginal = 0;
        }
      });
  }

  private recalcularGeneral(): void {
    const base = Number(this.form.get('base')!.value ?? 0);
    const menor = Number(this.form.get('aCajaMenor')!.value ?? 0);
    const general = this.saldo - base - menor;
    this.form.get('aCajaGeneral')!.setValue(general, { emitEvent: false });
  }

  confirmar(): void {
    this.recalcularGeneral();
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
    const base = Number(raw.base ?? 0);
    this.persistirBaseSiCambio(base)
      .pipe(
        switchMap(() =>
          this.corteVentaService.confirmarDistribucionEfectivo(corteId, {
            base,
            montoCajaMenor: Number(raw.aCajaMenor ?? 0),
            montoCajaGeneral: Number(raw.aCajaGeneral ?? 0),
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
}
