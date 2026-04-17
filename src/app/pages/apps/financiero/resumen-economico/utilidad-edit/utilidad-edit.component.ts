import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
  DateAdapter,
  NativeDateAdapter
} from '@angular/material/core';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EstadisticaFinancieraService } from '../service/estadistica-financiera.service';
import { httpErrorMessage } from '../http-error.util';
import { MonthYearPickerComponent } from '../../../../../core/components/month-year-picker/month-year-picker.component';

export type UtilidadEditPeriodo = 'dia' | 'mes' | 'anio';

export interface UtilidadEditDialogData {
  periodo: UtilidadEditPeriodo;
}

/** DateAdapter: muestra y parsea fechas como dd/MM/yyyy (solo UI; el API recibe yyyy-mm-dd) */
class DateAdapterDDMMYYYY extends NativeDateAdapter {
  override format(date: Date, displayFormat: object): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.includes('/')) {
      const [d, m, y] = value.split('/').map(Number);
      if (d && m && y) {
        return new Date(y, m - 1, d);
      }
    }
    return super.parse(value);
  }
}

@Component({
  selector: 'gm-utilidad-edit',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: DateAdapter, useClass: DateAdapterDDMMYYYY },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'dd/MM/yyyy' },
        display: {
          dateInput: 'dd/MM/yyyy',
          monthYearLabel: 'MMM yyyy',
          dateA11yLabel: 'dd/MM/yyyy',
          monthYearA11yLabel: 'MMMM yyyy'
        }
      }
    }
  ],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MonthYearPickerComponent
  ],
  templateUrl: './utilidad-edit.component.html',
  styleUrl: './utilidad-edit.component.scss'
})
export class UtilidadEditComponent implements OnInit {
  form: FormGroup;
  /** Mismo patrón que CorteVentasComponent (fechaInicioCtrl): evita desvinculación con el datepicker */
  fechaDiaCtrl = new FormControl<Date | null>(null, [Validators.required]);
  valorMesCtrl = new FormControl<Date | null>(null, [Validators.required]);
  periodo: UtilidadEditPeriodo;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UtilidadEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UtilidadEditDialogData,
    private estadisticaService: EstadisticaFinancieraService,
    private snackBar: MatSnackBar
  ) {
    const y = new Date().getFullYear();
    this.periodo = data?.periodo ?? 'dia';
    this.form = this.fb.group({
      valorMes: [''],
      valorAnio: [y]
    });
  }

  ngOnInit() {
    const today = new Date();
    const fechaHoy = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (this.periodo === 'dia') {
      this.fechaDiaCtrl.setValidators([Validators.required]);
      this.fechaDiaCtrl.setValue(fechaHoy);
      this.valorMesCtrl.clearValidators();
      this.valorMesCtrl.setValue(null);
      this.form.get('valorAnio')!.clearValidators();
    } else if (this.periodo === 'mes') {
      this.fechaDiaCtrl.clearValidators();
      this.fechaDiaCtrl.setValue(null);
      const y = today.getFullYear();
      const mesActual = new Date(y, today.getMonth(), 1);
      this.valorMesCtrl.setValidators([Validators.required]);
      this.valorMesCtrl.setValue(mesActual);
      this.form.get('valorAnio')!.clearValidators();
    } else {
      this.fechaDiaCtrl.clearValidators();
      this.fechaDiaCtrl.setValue(null);
      this.valorMesCtrl.clearValidators();
      this.valorMesCtrl.setValue(null);
      this.form
        .get('valorAnio')!
        .setValidators([
          Validators.required,
          Validators.min(2000),
          Validators.max(2100)
        ]);
    }
    this.form.updateValueAndValidity();
    this.fechaDiaCtrl.updateValueAndValidity();
    this.valorMesCtrl.updateValueAndValidity();
  }

  get titulo(): string {
    switch (this.periodo) {
      case 'dia':
        return 'Día';
      case 'mes':
        return 'Mes';
      case 'anio':
        return 'Año';
      default:
        return 'Período';
    }
  }

  /** API: yyyy-mm-dd (fecha local del datepicker) */
  private dateToYyyyMmDd(d: Date): string {
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  private dateToYyyyMm(d: Date): string {
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${mm}`;
  }

  private buildValorTiempo(): string | null {
    if (this.periodo === 'dia') {
      const fd = this.fechaDiaCtrl.value;
      if (!fd || !(fd instanceof Date) || isNaN(fd.getTime())) return null;
      return this.dateToYyyyMmDd(fd);
    }
    if (this.periodo === 'mes') {
      const mes = this.valorMesCtrl.value;
      if (!mes || !(mes instanceof Date) || isNaN(mes.getTime())) return null;
      return this.dateToYyyyMm(mes);
    }
    const y = Number(this.form.get('valorAnio')!.value);
    if (isNaN(y)) return null;
    return String(y);
  }

  puedeRegistrar(): boolean {
    if (this.periodo === 'mes') {
      const mes = this.valorMesCtrl.value;
      return !!mes && mes instanceof Date && !isNaN(mes.getTime());
    }
    if (this.periodo === 'anio') return this.form.valid;
    const fd = this.fechaDiaCtrl.value;
    return !!fd && fd instanceof Date && !isNaN(fd.getTime());
  }

  registrar() {
    const valorTiempo = this.buildValorTiempo();
    if (this.periodo === 'dia') {
      if (!valorTiempo) {
        alert('Seleccione una fecha válida.');
        return;
      }
    } else {
      if (!valorTiempo || this.form.invalid) return;
    }

    this.estadisticaService.postRegistrar({ valorTiempo }).subscribe({
      next: (r) => {
        this.snackBar.open(r.mensaje, undefined, {
          duration: 5000,
          horizontalPosition: 'right',
          panelClass: ['recibo-snackbar-success']
        });
        this.dialogRef.close(true);
      },
      error: (err) => this.mostrarError(err)
    });
  }

  private mostrarError(err: unknown) {
    const msg = httpErrorMessage(err);
    this.snackBar.open(msg, undefined, {
      duration: 7000,
      horizontalPosition: 'right',
      panelClass: ['recibo-snackbar-error']
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
