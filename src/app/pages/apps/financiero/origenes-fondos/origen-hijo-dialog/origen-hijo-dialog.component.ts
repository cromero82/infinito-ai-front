import { Component, Inject } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import {
  OrigenFondosDto,
  OrigenFondosService
} from '../service/origen-fondos.service';

export interface OrigenHijoDialogData {
  parentId: number;
  parentNombre: string;
}

@Component({
  selector: 'vex-origen-hijo-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './origen-hijo-dialog.component.html',
  styleUrl: './origen-hijo-dialog.component.scss'
})
export class OrigenHijoDialogComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private origenService: OrigenFondosService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OrigenHijoDialogComponent, OrigenFondosDto | false>,
    @Inject(MAT_DIALOG_DATA) public data: OrigenHijoDialogData
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]]
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.origenService
      .crearHijo({
        parentOrigenFondosId: this.data.parentId,
        nombre: String(this.form.value.nombre ?? '').trim()
      })
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.errores?.[0]?.descripcionError ||
            'No se pudo crear el fondo hijo.';
          this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
        }
      });
  }
}
