import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
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
import { finalize } from 'rxjs/operators';
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
export class DistribucionEfectivoDialogComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  guardando = false;
  readonly saldo: number;

  @ViewChild('cajaMenorInput') cajaMenorInput?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<
      DistribucionEfectivoDialogComponent,
      DistribucionEfectivoDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: DistribucionEfectivoDialogData,
    private corteVentaService: CorteVentaService,
    private snackBar: MatSnackBar
  ) {
    this.saldo = Number(data.pendiente.saldoCajaEfectivo ?? 0);
    // Base inicia en 0; General absorbe el residual (saldo − base − menor).
    this.form = this.fb.group({
      base: [0, [Validators.required, Validators.min(0)]],
      aCajaMenor: [0, [Validators.required, Validators.min(0)]],
      aCajaGeneral: [{ value: this.saldo, disabled: true }],
      observacion: ['']
    });
  }

  ngOnInit(): void {
    this.form.get('base')!.valueChanges.subscribe(() => this.recalcularGeneral());
    this.form.get('aCajaMenor')!.valueChanges.subscribe(() => this.recalcularGeneral());
    this.recalcularGeneral();
  }

  ngAfterViewInit(): void {
    // Tras abrir el overlay de Material, enfocar y seleccionar el 0 de Caja Menor.
    setTimeout(() => this.focusYSeleccionarCajaMenor(), 0);
  }

  /** Selecciona todo el valor (p. ej. el 0) para reemplazarlo al escribir. */
  seleccionarContenido(input: HTMLInputElement | null | undefined): void {
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }

  focusYSeleccionarCajaMenor(): void {
    this.seleccionarContenido(this.cajaMenorInput?.nativeElement);
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
    this.corteVentaService
      .confirmarDistribucionEfectivo(corteId, {
        base: Number(raw.base ?? 0),
        montoCajaMenor: Number(raw.aCajaMenor ?? 0),
        montoCajaGeneral: Number(raw.aCajaGeneral ?? 0),
        observacion: (raw.observacion as string)?.trim() || undefined
      })
      .pipe(finalize(() => (this.guardando = false)))
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
            'No se pudo confirmar la distribución.';
          this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
        }
      });
  }

  definirLuego(): void {
    this.dialogRef.close({ confirmada: false, definirLuego: true });
  }
}
