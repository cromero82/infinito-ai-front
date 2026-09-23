import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import {
  BaseInicialPendienteDto,
  CorteVentaService
} from '../../../ventas/service/corte-venta.service';

export interface BaseInicialDialogData {
  pendiente: BaseInicialPendienteDto;
}

export interface BaseInicialDialogResult {
  confirmada: boolean;
}

@Component({
  selector: 'vex-base-inicial-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './base-inicial-dialog.component.html',
  styleUrl: './base-inicial-dialog.component.scss'
})
export class BaseInicialDialogComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<
      BaseInicialDialogComponent,
      BaseInicialDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: BaseInicialDialogData,
    private corteVentaService: CorteVentaService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      valor: [null, [Validators.required, Validators.min(0.01)]],
      fecha: [new Date(), Validators.required],
      observacion: ['']
    });
  }

  cancelar(): void {
    this.dialogRef.close({ confirmada: false });
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const fecha = this.toIsoDate(this.form.value.fecha);
    const valor = Number(this.form.value.valor);
    const observacion = this.form.value.observacion?.trim() || undefined;

    this.guardando = true;
    this.corteVentaService
      .confirmarBaseInicial({ valor, fecha, observacion })
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => this.dialogRef.close({ confirmada: true }),
        error: (err) => {
          const msg =
            err?.error?.errores?.[0]?.descripcionError ||
            err?.error?.message ||
            'No se pudo registrar la entrada inicial.';
          this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
        }
      });
  }

  private toIsoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
