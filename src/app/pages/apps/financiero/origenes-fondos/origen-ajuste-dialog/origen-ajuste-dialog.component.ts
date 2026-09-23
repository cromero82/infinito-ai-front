import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { OrigenFondosArbolItemDto } from '../util/origen-fondos-arbol.util';
import {
  MovimientoAjusteRequest,
  MovimientoOrigenFondosService
} from '../service/movimiento-origen-fondos.service';
import {
  MotivoMovimientoDto,
  MotivoMovimientoService
} from '../service/motivo-movimiento.service';

export interface OrigenAjusteDialogData {
  cuentaId?: number;
  arbol: OrigenFondosArbolItemDto[];
}

@Component({
  selector: 'vex-origen-ajuste-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './origen-ajuste-dialog.component.html',
  styleUrl: './origen-ajuste-dialog.component.scss'
})
export class OrigenAjusteDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  motivos: MotivoMovimientoDto[] = [];

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoOrigenFondosService,
    private motivoService: MotivoMovimientoService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OrigenAjusteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrigenAjusteDialogData
  ) {
    const saldoSistema =
      data.arbol.find((c) => c.id === data.cuentaId)?.saldo ?? 0;
    this.form = this.fb.group({
      origenFondosId: [data.cuentaId ?? null, Validators.required],
      valorSistema: [saldoSistema, Validators.required],
      valorReal: [saldoSistema, [Validators.required]],
      fecha: [new Date(), Validators.required],
      motivoMovimientoId: [null, Validators.required],
      observacion: ['']
    });
  }

  ngOnInit(): void {
    this.motivoService.findActivos().subscribe({
      next: (motivos) => {
        this.motivos = motivos.filter((m) => m.categoria === 'AJUSTE');
      }
    });
  }

  onCuentaChange(cuentaId: number): void {
    const cuenta = this.data.arbol.find((c) => c.id === cuentaId);
    if (cuenta) {
      const saldo = cuenta.saldo ?? 0;
      this.form.patchValue({ valorSistema: saldo, valorReal: saldo });
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: MovimientoAjusteRequest = {
      origenFondosId: this.form.value.origenFondosId,
      valorSistema: Number(this.form.value.valorSistema),
      valorReal: Number(this.form.value.valorReal),
      fecha: this.toIsoDate(this.form.value.fecha),
      motivoMovimientoId: this.form.value.motivoMovimientoId,
      observacion: this.form.value.observacion?.trim() || undefined
    };

    this.guardando = true;
    this.movimientoService
      .ajuste(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg =
            err?.error?.errores?.[0]?.descripcionError ||
            err?.error?.message ||
            'No se pudo registrar el ajuste.';
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
