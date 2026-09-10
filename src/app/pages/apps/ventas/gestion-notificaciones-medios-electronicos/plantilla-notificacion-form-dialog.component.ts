import { Component, Inject, OnInit } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  GestionNotificacionesMediosService,
  PlantillaNotificacionPagoDto
} from '../service/gestion-notificaciones-medios.service';
import { OrigenFondosService } from '../../financiero/origenes-fondos/service/origen-fondos.service';
import { OrigenFondosArbolItemDto } from '../../financiero/origenes-fondos/util/origen-fondos-arbol.util';
import { MetodoPagoDto, MetodoPagoService } from '../service/metodo-pago.service';

const ORIGEN_TIPO_MOVIMIENTO_BANCO = 'MOVIMIENTO BANCO POR IDENTIFICAR';

export interface PlantillaNotificacionFormDialogData {
  plantilla?: PlantillaNotificacionPagoDto | null;
  /** Prefill método (p.ej. desde Dominios). */
  metodoPagoIdPrefill?: number | null;
}

@Component({
  selector: 'app-plantilla-notificacion-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ editingId != null ? 'Editar plantilla' : 'Nueva plantilla' }}
    </h2>
    <mat-dialog-content>
      <form class="form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" maxlength="40" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Naturaleza</mat-label>
          <mat-select formControlName="naturaleza" (selectionChange)="onNaturalezaChange()">
            @for (n of naturalezas; track n.value) {
              <mat-option [value]="n.value">{{ n.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Método de pago</mat-label>
          <mat-select formControlName="metodoPagoId">
            <mat-option [value]="null">—</mat-option>
            @for (m of metodosNotificacion; track m.id) {
              <mat-option [value]="m.id">
                <span class="opt">
                  @if (m.file) {
                    <img [src]="iconoUrl(m.file)" alt="" width="20" height="20" />
                  }
                  {{ m.descripcion }}
                </span>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Origen de fondos origen</mat-label>
          <mat-select formControlName="origenFondosOrigenId">
            <mat-option [value]="null">—</mat-option>
            @for (c of origenesArbol; track c.id) {
              <mat-option [value]="c.id">{{ c.nombreDisplay }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Origen de fondos destino</mat-label>
          <mat-select formControlName="origenFondosDestinoId">
            <mat-option [value]="null">—</mat-option>
            @for (c of origenesArbol; track c.id) {
              <mat-option [value]="c.id">{{ c.nombreDisplay }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Cuerpo</mat-label>
          <textarea matInput rows="5" formControlName="cuerpo"></textarea>
          <mat-hint ngNonBindable>Fragmento con {{monto}}, {{nombrePagador}}, etc.</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close(false)" [disabled]="saving">
        Cancelar
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="form.invalid || saving"
        (click)="save()">
        @if (saving) {
          Guardando…
        } @else {
          {{ editingId != null ? 'Guardar' : 'Crear' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: min(520px, 92vw);
        padding-top: 4px;
      }
      .full {
        width: 100%;
      }
      .opt {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .opt img {
        object-fit: contain;
      }
    `
  ]
})
export class PlantillaNotificacionFormDialogComponent implements OnInit {
  form: FormGroup;
  saving = false;
  editingId: number | null = null;
  metodosNotificacion: MetodoPagoDto[] = [];
  origenesArbol: OrigenFondosArbolItemDto[] = [];
  readonly naturalezas = [
    { value: 'INGRESO', label: 'Ingreso' },
    { value: 'EGRESO', label: 'Egreso' }
  ];

  constructor(
    public ref: MatDialogRef<PlantillaNotificacionFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: PlantillaNotificacionFormDialogData,
    private fb: FormBuilder,
    private api: GestionNotificacionesMediosService,
    private metodoPagoService: MetodoPagoService,
    private origenFondosService: OrigenFondosService,
    private snackBar: MatSnackBar
  ) {
    const p = data?.plantilla;
    this.editingId = p?.id && p.id > 0 ? p.id : null;
    this.form = this.fb.group({
      nombre: [p?.nombre || '', [Validators.required, Validators.maxLength(40)]],
      naturaleza: [p?.naturaleza || 'INGRESO', Validators.required],
      metodoPagoId: [p?.metodoPagoId ?? data?.metodoPagoIdPrefill ?? null],
      origenFondosOrigenId: [p?.origenFondosOrigenId ?? null],
      origenFondosDestinoId: [p?.origenFondosDestinoId ?? null],
      cuerpo: [
        p?.cuerpo ||
          'recibiste una transferencia de {{nombrePagador}} por {{monto}} en tu cuenta *{{referenciaCuenta}}',
        Validators.required
      ],
      orden: [p?.orden ?? 1],
      activo: [p?.activo !== false],
      icono: [p?.icono ?? null]
    });
  }

  ngOnInit(): void {
    this.metodoPagoService.clearCache();
    this.metodoPagoService.obtenerMetodosPago().subscribe({
      next: (list) => {
        this.metodosNotificacion = (list || []).filter((m) => !!m.permiteNotificacion);
        if (this.form.value.metodoPagoId == null && this.metodosNotificacion.length) {
          const prefill = this.data?.metodoPagoIdPrefill ?? this.metodosNotificacion[0].id;
          this.form.patchValue({ metodoPagoId: prefill });
        }
      }
    });
    this.origenFondosService.findArbol().subscribe({
      next: (list) => {
        this.origenesArbol = list || [];
      }
    });
    this.onNaturalezaChange(false);
  }

  get esIngreso(): boolean {
    return (this.form.value.naturaleza || '').toUpperCase() === 'INGRESO';
  }

  get esEgreso(): boolean {
    return (this.form.value.naturaleza || '').toUpperCase() === 'EGRESO';
  }

  iconoUrl(file?: string | null): string {
    return this.metodoPagoService.iconoUrl(file);
  }

  private iconoDeMetodo(metodoPagoId: number | null): string | null {
    if (metodoPagoId == null) {
      return null;
    }
    return this.metodosNotificacion.find((m) => m.id === metodoPagoId)?.file || null;
  }

  onNaturalezaChange(clear = true): void {
    if (this.esIngreso) {
      if (clear) {
        this.form.patchValue({
          origenFondosOrigenId: null,
          origenFondosDestinoId: null
        });
      }
      this.form.get('origenFondosOrigenId')?.disable({ emitEvent: false });
      this.form.get('origenFondosDestinoId')?.disable({ emitEvent: false });
    } else if (this.esEgreso) {
      this.form.get('origenFondosOrigenId')?.enable({ emitEvent: false });
      this.form.get('origenFondosDestinoId')?.enable({ emitEvent: false });
    }
    this.form.get('metodoPagoId')?.enable({ emitEvent: false });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const esEgreso = (raw.naturaleza || '').toUpperCase() === 'EGRESO';
    if (raw.metodoPagoId == null) {
      this.toast('Selecciona un método de pago con notificaciones', true);
      return;
    }
    if (esEgreso && (raw.origenFondosOrigenId == null || raw.origenFondosDestinoId == null)) {
      this.toast('Selecciona origen y destino de fondos', true);
      return;
    }
    const body = {
      nombre: (raw.nombre || '').trim(),
      cuerpo: (raw.cuerpo || '').trim(),
      icono: this.iconoDeMetodo(raw.metodoPagoId) || raw.icono || null,
      metodoPagoId: raw.metodoPagoId,
      activo: raw.activo !== false,
      orden: raw.orden,
      naturaleza: raw.naturaleza || null,
      origenFondosOrigenId: esEgreso ? raw.origenFondosOrigenId : null,
      origenFondosDestinoId: esEgreso ? raw.origenFondosDestinoId : null,
      origenTipo: ORIGEN_TIPO_MOVIMIENTO_BANCO
    };
    this.saving = true;
    const req$ =
      this.editingId != null
        ? this.api.guardarPlantilla(this.editingId, body)
        : this.api.crearPlantilla(body);
    req$.subscribe({
      next: () => {
        this.saving = false;
        this.toast(this.editingId != null ? 'Plantilla actualizada' : 'Plantilla creada');
        this.ref.close(true);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.toast(err?.error?.message || err?.message || 'No se pudo guardar', true);
      }
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
