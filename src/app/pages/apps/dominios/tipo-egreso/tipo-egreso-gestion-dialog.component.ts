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
import { MatSelectModule } from '@angular/material/select';
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
  TipoEgresoDto,
  TipoEgresoService,
  TipoEgresoWriteDto
} from '../../financiero/egresos/service/tipo-egreso.service';
import {
  NaturalezaTipoEgresoDto,
  NaturalezaTipoEgresoService
} from '../../financiero/egresos/service/naturaleza-tipo-egreso.service';

@Component({
  selector: 'vex-tipo-egreso-gestion-dialog',
  templateUrl: './tipo-egreso-gestion-dialog.component.html',
  styleUrls: ['./tipo-egreso-gestion-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class TipoEgresoGestionDialogComponent implements OnInit {
  displayedColumns = ['id', 'nombre', 'naturaleza', 'descripcion', 'acciones'];
  rows: TipoEgresoDto[] = [];
  filtered: TipoEgresoDto[] = [];
  naturalezas: NaturalezaTipoEgresoDto[] = [];
  loading = false;
  saving = false;
  mode: 'list' | 'form' = 'list';
  editingId: number | null = null;
  searchCtrl = new UntypedFormControl('');
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tipoEgresoService: TipoEgresoService,
    private naturalezaService: NaturalezaTipoEgresoService,
    private dialogRef: MatDialogRef<TipoEgresoGestionDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(2000)]],
      naturalezaId: [null as number | null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadNaturalezas();
    this.load();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((q) => this.applyFilter(q));
  }

  close(): void {
    this.dialogRef.close();
  }

  loadNaturalezas(): void {
    this.naturalezaService.getAll(true).subscribe({
      next: (data) => {
        this.naturalezas = data || [];
      },
      error: () => {
        this.naturalezas = [];
        this.toast('No se pudieron cargar naturalezas', true);
      }
    });
  }

  load(): void {
    this.loading = true;
    this.tipoEgresoService.getTiposEgreso().subscribe({
      next: (data: TipoEgresoDto[]) => {
        this.rows = [...(data || [])].sort((a, b) => a.id - b.id);
        this.applyFilter(this.searchCtrl.value);
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
        this.loading = false;
        this.toast('No se pudieron cargar los tipos de egreso', true);
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
        (r.nombre || '').toLowerCase().includes(q) ||
        (r.descripcion || '').toLowerCase().includes(q) ||
        (r.naturaleza?.nombre || '').toLowerCase().includes(q) ||
        (r.naturaleza?.codigo || '').toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({ nombre: '', descripcion: '', naturalezaId: null });
    this.mode = 'form';
  }

  startEdit(row: TipoEgresoDto): void {
    this.editingId = row.id;
    this.form.reset({
      nombre: row.nombre || '',
      descripcion: row.descripcion || '',
      naturalezaId: row.naturaleza?.id ?? null
    });
    this.mode = 'form';
  }

  cancelForm(): void {
    this.mode = 'list';
    this.editingId = null;
    this.form.reset({ nombre: '', descripcion: '', naturalezaId: null });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const dto: TipoEgresoWriteDto = {
      nombre: (this.form.value.nombre || '').trim(),
      descripcion: (this.form.value.descripcion || '').trim() || null,
      naturaleza: { id: Number(this.form.value.naturalezaId) }
    };
    this.saving = true;
    const req$ =
      this.editingId != null
        ? this.tipoEgresoService.update(this.editingId, dto)
        : this.tipoEgresoService.create(dto);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.toast(
          this.editingId != null ? 'Tipo de egreso actualizado' : 'Tipo de egreso creado'
        );
        this.cancelForm();
        this.load();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.toast(err?.error?.message || err?.message || 'No se pudo guardar', true);
      }
    });
  }

  confirmDelete(row: TipoEgresoDto): void {
    const data: ConfirmDialogData = {
      titulo: 'Eliminar tipo de egreso',
      mensaje: `¿Eliminar «${row.nombre}»? Si está en uso, la operación puede fallar.`
    };
    this.dialog
      .open(ConfirmDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.tipoEgresoService.delete(row.id).subscribe({
          next: () => {
            this.toast('Tipo de egreso eliminado');
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
