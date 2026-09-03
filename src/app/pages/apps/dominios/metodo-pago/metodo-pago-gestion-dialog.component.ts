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
  MetodoPagoDto,
  MetodoPagoService,
  MetodoPagoWriteDto
} from '../../ventas/service/metodo-pago.service';
import { PlantillasAsociadasDialogComponent } from '../../ventas/gestion-notificaciones-medios-electronicos/plantillas-asociadas-dialog.component';

@Component({
  selector: 'vex-metodo-pago-gestion-dialog',
  templateUrl: './metodo-pago-gestion-dialog.component.html',
  styleUrls: ['./metodo-pago-gestion-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class MetodoPagoGestionDialogComponent implements OnInit {
  displayedColumns = [
    'icono',
    'id',
    'descripcion',
    'sigla',
    'tickets',
    'egresos',
    'notif',
    'estado',
    'acciones'
  ];
  rows: MetodoPagoDto[] = [];
  filtered: MetodoPagoDto[] = [];
  loading = false;
  saving = false;
  mode: 'list' | 'form' = 'list';
  editingId: number | null = null;
  searchCtrl = new UntypedFormControl('');
  form: FormGroup;

  readonly iconosDisponibles = [
    'money.png',
    'qr-bancolombia.png',
    'nequi-logo.png'
  ];

  constructor(
    private fb: FormBuilder,
    private metodoPagoService: MetodoPagoService,
    private dialogRef: MatDialogRef<MetodoPagoGestionDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.maxLength(120)]],
      descripcionEgreso: ['', [Validators.maxLength(100)]],
      sigla: ['', [Validators.maxLength(10)]],
      color: ['#1976d2', [Validators.maxLength(20)]],
      file: ['money.png'],
      estado: ['ACTIVO'],
      visiblePagoTickets: [true],
      visiblePagosEgresos: [true],
      permiteNotificacion: [false],
      monto: [null as number | null],
      codigoDianPaymentMeans: ['', [Validators.maxLength(3)]]
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

  abrirPlantillasAsociadas(): void {
    this.dialog.open(PlantillasAsociadasDialogComponent, {
      width: '780px',
      maxWidth: '96vw',
      autoFocus: false,
      data: {}
    });
  }

  abrirPlantillasDeMetodo(row: MetodoPagoDto): void {
    this.dialog.open(PlantillasAsociadasDialogComponent, {
      width: '780px',
      maxWidth: '96vw',
      autoFocus: false,
      data: {
        metodoPagoId: row.id,
        metodoPagoDescripcion: row.descripcion
      }
    });
  }

  iconoUrl(file?: string | null): string {
    return this.metodoPagoService.iconoUrl(file);
  }

  load(): void {
    this.loading = true;
    this.metodoPagoService.clearCache();
    this.metodoPagoService.obtenerMetodosPago().subscribe({
      next: (data: MetodoPagoDto[]) => {
        this.rows = [...(data || [])];
        this.applyFilter(this.searchCtrl.value);
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.filtered = [];
        this.loading = false;
        this.toast('No se pudieron cargar los métodos de pago', true);
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
        (r.descripcion || '').toLowerCase().includes(q) ||
        (r.sigla || '').toLowerCase().includes(q) ||
        (r.file || '').toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      descripcion: '',
      descripcionEgreso: '',
      sigla: '',
      color: '#1976d2',
      file: 'money.png',
      estado: 'ACTIVO',
      visiblePagoTickets: true,
      visiblePagosEgresos: true,
      permiteNotificacion: false,
      monto: null,
      codigoDianPaymentMeans: ''
    });
    this.mode = 'form';
  }

  startEdit(row: MetodoPagoDto): void {
    this.editingId = row.id;
    this.form.reset({
      descripcion: row.descripcion || '',
      descripcionEgreso: row.descripcionEgreso || '',
      sigla: row.sigla || '',
      color: row.color || '#1976d2',
      file: row.file || 'money.png',
      estado: row.estado || 'ACTIVO',
      visiblePagoTickets: row.visiblePagoTickets !== false,
      visiblePagosEgresos: row.visiblePagosEgresos !== false,
      permiteNotificacion: !!row.permiteNotificacion,
      monto: row.monto ?? null,
      codigoDianPaymentMeans: row.codigoDianPaymentMeans || ''
    });
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
    const v = this.form.value;
    const dto: MetodoPagoWriteDto = {
      descripcion: (v.descripcion || '').trim(),
      descripcionEgreso: (v.descripcionEgreso || '').trim() || null,
      sigla: (v.sigla || '').trim() || null,
      color: (v.color || '').trim() || null,
      file: (v.file || '').trim() || null,
      estado: v.estado || 'ACTIVO',
      visiblePagoTickets: !!v.visiblePagoTickets,
      visiblePagosEgresos: !!v.visiblePagosEgresos,
      permiteNotificacion: !!v.permiteNotificacion,
      monto: v.monto != null && v.monto !== '' ? Number(v.monto) : null,
      codigoDianPaymentMeans: (v.codigoDianPaymentMeans || '').trim() || null
    };
    this.saving = true;
    const req$ =
      this.editingId != null
        ? this.metodoPagoService.update(this.editingId, dto)
        : this.metodoPagoService.create(dto);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.toast(
          this.editingId != null ? 'Método de pago actualizado' : 'Método de pago creado'
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

  confirmDelete(row: MetodoPagoDto): void {
    const data: ConfirmDialogData = {
      titulo: 'Desactivar método de pago',
      mensaje: `¿Desactivar «${row.descripcion}»? Quedará inactivo y oculto en tickets/egresos/notificaciones.`
    };
    this.dialog
      .open(ConfirmDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.metodoPagoService.delete(row.id).subscribe({
          next: () => {
            this.toast('Método de pago desactivado');
            this.load();
          },
          error: (err: { error?: { message?: string }; message?: string }) => {
            this.toast(err?.error?.message || err?.message || 'No se pudo desactivar', true);
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
