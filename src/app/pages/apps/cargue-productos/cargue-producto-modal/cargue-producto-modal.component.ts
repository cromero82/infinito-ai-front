import { Component, OnInit } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CargueProductosService,
  CargueProductoDto
} from '../service/cargue-productos.service';

@Component({
  selector: 'vex-cargue-producto-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './cargue-producto-modal.component.html',
  styleUrls: ['./cargue-producto-modal.component.scss']
})
export class CargueProductoModalComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  selectedFileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CargueProductoModalComponent>,
    private cargueProductosService: CargueProductosService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      file: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['.xls', '.xlsx', '.csv'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        this.error =
          'Por favor seleccione un archivo Excel (.xls, .xlsx) o CSV (.csv)';
        this.form.patchValue({ file: null });
        this.selectedFileName = null;
        return;
      }

      this.form.patchValue({ file: file });
      this.selectedFileName = file.name;
      this.error = null;
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    const nombre = this.form.get('nombre')?.value;
    const file = this.form.get('file')?.value;

    if (!file) {
      this.error = 'Por favor seleccione un archivo';
      return;
    }

    this.loading = true;
    this.error = null;

    this.cargueProductosService
      .registrarCargueProducto(nombre, file)
      .subscribe({
        next: (result: CargueProductoDto) => {
          this.loading = false;
          this.dialogRef.close(result);
        },
        error: (err) => {
          console.error('Error al registrar cargue de productos', err);
          this.error =
            err.error?.message ||
            'Error al registrar el cargue de productos. Por favor intente nuevamente.';
          this.loading = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  removeFile(): void {
    this.form.patchValue({ file: null });
    this.selectedFileName = null;
    this.error = null;
  }
}
