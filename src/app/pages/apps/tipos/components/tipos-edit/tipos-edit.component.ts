import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Tipo } from '../../interfaces/tipo.interface';
import { TiposService } from '../../service/tipos-service';

@Component({
  selector: 'vex-tipos-edit',
  templateUrl: './tipos-edit.component.html',
  styleUrls: ['./tipos-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class TiposEditComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TiposEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: number | null,
    private tiposService: TiposService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      percentProfit: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      percentProfit: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    if (this.data) {
      // Edit mode
      this.tiposService.getTipo(this.data).subscribe(tipo => {
        this.form.patchValue(tipo);
        this.isEditMode = true;
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const tipoData = {
        name: this.form.get('name')?.value,
        percentProfit: this.form.get('percentProfit')?.value
      };

      if (this.isEditMode && this.data) {
        this.tiposService.updateTipo(this.data, tipoData).subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error updating tipo:', error);
          }
        });
      } else {
        this.tiposService.createTipo(tipoData).subscribe({
          next: () => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error creating tipo:', error);
          }
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 