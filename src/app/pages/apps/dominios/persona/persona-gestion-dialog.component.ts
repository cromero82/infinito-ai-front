import { Component, Inject, OnInit, Optional } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
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
  PersonaDto,
  PersonaService,
  PersonaWriteDto
} from '../../financiero/egresos/service/persona.service';

export interface PersonaGestionDialogData {
  initialNombre?: string;
  /** Cierra el diálogo con la ficha guardada (alta o edición). */
  returnOnSave?: boolean;
  /** Abre directo en alta, sin listado. */
  startInCreate?: boolean;
  /** Abre directo en edición. */
  editPersona?: PersonaDto;
}

@Component({
  selector: 'vex-persona-gestion-dialog',
  templateUrl: './persona-gestion-dialog.component.html',
  styleUrls: ['./persona-gestion-dialog.component.scss'],
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
export class PersonaGestionDialogComponent implements OnInit {
  displayedColumns = ['id', 'documento', 'nombre', 'telefono', 'dueño', 'activo', 'acciones'];
  rows: PersonaDto[] = [];
  filtered: PersonaDto[] = [];
  loading = false;
  saving = false;
  mode: 'list' | 'form' = 'list';
  editingId: number | null = null;
  searchCtrl = new UntypedFormControl('');
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    private dialogRef: MatDialogRef<PersonaGestionDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: PersonaGestionDialogData | null
  ) {
    this.form = this.fb.group({
      documento: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      telefono: ['', [Validators.maxLength(30)]],
      correo: ['', [Validators.maxLength(100)]],
      activo: [true],
      esDuenoPropietario: [false]
    });
  }

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((q) => this.applyFilter(q));
    if (this.data?.editPersona) {
      this.startEdit(this.data.editPersona);
    } else if (this.data?.startInCreate || this.data?.initialNombre) {
      this.startCreate();
      if (this.data.initialNombre) {
        this.form.patchValue({ nombre: this.data.initialNombre });
      }
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  load(): void {
    this.loading = true;
    this.personaService.getAll(false).subscribe({
      next: (data: PersonaDto[]) => {
        this.rows = [...(data || [])].sort((a, b) =>
          (a.nombre || '').localeCompare(b.nombre || '')
        );
        this.applyFilter(this.searchCtrl.value);
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
        this.loading = false;
        this.toast('No se pudieron cargar las personas', true);
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
        (r.documento || '').toLowerCase().includes(q) ||
        (r.telefono || '').toLowerCase().includes(q) ||
        (r.correo || '').toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      documento: '',
      nombre: '',
      telefono: '',
      correo: '',
      activo: true,
      esDuenoPropietario: false
    });
    this.mode = 'form';
  }

  startEdit(row: PersonaDto): void {
    this.editingId = row.id;
    this.form.reset({
      documento: row.documento || '',
      nombre: row.nombre || '',
      telefono: row.telefono || '',
      correo: row.correo || '',
      activo: row.activo !== false,
      esDuenoPropietario: !!row.esDuenoPropietario
    });
    this.mode = 'form';
  }

  cancelForm(): void {
    this.mode = 'list';
    this.editingId = null;
    this.form.reset({
      documento: '',
      nombre: '',
      telefono: '',
      correo: '',
      activo: true,
      esDuenoPropietario: false
    });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const dto: PersonaWriteDto = {
      documento: (this.form.value.documento || '').trim(),
      nombre: (this.form.value.nombre || '').trim(),
      telefono: (this.form.value.telefono || '').trim() || null,
      correo: (this.form.value.correo || '').trim() || null,
      activo: !!this.form.value.activo,
      esDuenoPropietario: !!this.form.value.esDuenoPropietario
    };
    this.saving = true;
    const req$ =
      this.editingId != null
        ? this.personaService.update(this.editingId, dto)
        : this.personaService.create(dto);

    req$.subscribe({
      next: (saved: PersonaDto) => {
        this.saving = false;
        this.toast(this.editingId != null ? 'Persona actualizada' : 'Persona creada');
        if (this.data?.returnOnSave) {
          this.dialogRef.close(saved);
          return;
        }
        this.cancelForm();
        this.load();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.toast(err?.error?.message || err?.message || 'No se pudo guardar', true);
      }
    });
  }

  confirmDelete(row: PersonaDto): void {
    const data: ConfirmDialogData = {
      titulo: 'Eliminar persona',
      mensaje: `¿Eliminar «${row.nombre}» (${row.documento})? Si tiene egresos, no se podrá eliminar.`
    };
    this.dialog
      .open(ConfirmDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.personaService.delete(row.id).subscribe({
          next: () => {
            this.toast('Persona eliminada');
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
