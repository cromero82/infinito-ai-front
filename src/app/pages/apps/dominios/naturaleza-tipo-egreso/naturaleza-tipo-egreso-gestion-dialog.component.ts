import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import {
  NaturalezaTipoEgresoDto,
  NaturalezaTipoEgresoService,
  NaturalezaTipoEgresoWriteDto
} from '../../financiero/egresos/service/naturaleza-tipo-egreso.service';

@Component({
  selector: 'vex-naturaleza-tipo-egreso-gestion-dialog',
  templateUrl: './naturaleza-tipo-egreso-gestion-dialog.component.html',
  styleUrls: ['./naturaleza-tipo-egreso-gestion-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class NaturalezaTipoEgresoGestionDialogComponent implements OnInit {
  displayedColumns = ['id', 'codigo', 'nombre', 'activo', 'acciones'];
  rows: NaturalezaTipoEgresoDto[] = [];
  filtered: NaturalezaTipoEgresoDto[] = [];
  loading = false;
  saving = false;
  mode: 'list' | 'form' = 'list';
  editingId: number | null = null;
  searchCtrl = new UntypedFormControl('');
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private naturalezaService: NaturalezaTipoEgresoService,
    private dialogRef: MatDialogRef<NaturalezaTipoEgresoGestionDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(40)]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      descripcion: ['', [Validators.maxLength(2000)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((q) => this.applyFilter(q));
  }

  close(): void {
    this.dialogRef.close();
  }

  load(): void {
    this.loading = true;
    this.naturalezaService.getAll(false).subscribe({
      next: (data) => {
        this.rows = [...(data || [])].sort((a, b) => a.id - b.id);
        this.applyFilter(this.searchCtrl.value);
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
        this.loading = false;
        this.toast('No se pudieron cargar naturalezas', true);
      }
    });
  }

  applyFilter(raw: string | null): void {
    const q = (raw || '').trim().toLowerCase();
    if (!q) {
      this.filtered = [...this.rows];
      return;
    }
    this.filtered = this.rows.filter(
      (r) =>
        (r.codigo || '').toLowerCase().includes(q) ||
        (r.nombre || '').toLowerCase().includes(q) ||
        (r.descripcion || '').toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({ codigo: '', nombre: '', descripcion: '', activo: true });
    this.form.get('codigo')?.enable({ emitEvent: false });
    this.mode = 'form';
  }

  startEdit(row: NaturalezaTipoEgresoDto): void {
    this.editingId = row.id;
    this.form.reset({
      codigo: row.codigo || '',
      nombre: row.nombre || '',
      descripcion: row.descripcion || '',
      activo: row.activo !== false
    });
    // codigo estable: editable con cuidado; permitimos editar
    this.mode = 'form';
  }

  cancelForm(): void {
    this.mode = 'list';
    this.editingId = null;
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const dto: NaturalezaTipoEgresoWriteDto = {
      codigo: (this.form.value.codigo || '').trim().toUpperCase(),
      nombre: (this.form.value.nombre || '').trim(),
      descripcion: (this.form.value.descripcion || '').trim() || null,
      activo: !!this.form.value.activo
    };
    this.saving = true;
    const req$ =
      this.editingId != null
        ? this.naturalezaService.update(this.editingId, dto)
        : this.naturalezaService.create(dto);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.toast(this.editingId != null ? 'Naturaleza actualizada' : 'Naturaleza creada');
        this.cancelForm();
        this.load();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.toast(err?.error?.message || err?.message || 'No se pudo guardar', true);
      }
    });
  }

  confirmDelete(row: NaturalezaTipoEgresoDto): void {
    const data: ConfirmDialogData = {
      titulo: 'Eliminar naturaleza',
      mensaje: `¿Eliminar «${row.nombre}» (${row.codigo})? Solo si ningún tipo de egreso la usa.`
    };
    this.dialog
      .open(ConfirmDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.naturalezaService.delete(row.id).subscribe({
          next: () => {
            this.toast('Naturaleza eliminada');
            this.load();
          },
          error: (err: { error?: { message?: string }; message?: string }) => {
            this.toast(err?.error?.message || err?.message || 'No se pudo eliminar', true);
          }
        });
      });
  }

  private toast(message: string, error = false): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: error ? ['error-snackbar'] : undefined
    });
  }
}
