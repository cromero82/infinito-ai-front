import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
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
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { OrigenFondosArbolItemDto } from '../util/origen-fondos-arbol.util';
import {
  MovimientoOrigenFondosService,
  MovimientoEntradaRequest,
  MovimientoPrestamoRequest,
  MovimientoTrasladoRequest
} from '../service/movimiento-origen-fondos.service';
import {
  MotivoMovimientoDto,
  MotivoMovimientoService
} from '../service/motivo-movimiento.service';

export type OrigenMovimientoTipo = 'entrada' | 'prestamo' | 'traslado';

export interface OrigenMovimientoDialogData {
  tipo: OrigenMovimientoTipo;
  cuentaId?: number;
  destinoId?: number;
  arbol: OrigenFondosArbolItemDto[];
}

@Component({
  selector: 'vex-origen-movimiento-dialog',
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
  templateUrl: './origen-movimiento-dialog.component.html',
  styleUrl: './origen-movimiento-dialog.component.scss'
})
export class OrigenMovimientoDialogComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  guardando = false;
  motivos: MotivoMovimientoDto[] = [];
  titulo = 'Movimiento';

  @ViewChild('origenSelect') origenSelect?: MatSelect;
  @ViewChild('valorInput') valorInput?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoOrigenFondosService,
    private motivoService: MotivoMovimientoService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OrigenMovimientoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrigenMovimientoDialogData
  ) {
    this.form = this.fb.group({
      origenFondosId: [data.cuentaId ?? null, Validators.required],
      origenDestinoId: [data.destinoId ?? null],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      fecha: [new Date(), Validators.required],
      terceroNombre: [''],
      motivoMovimientoId: [null],
      observacion: ['']
    });
  }

  ngOnInit(): void {
    this.titulo =
      this.data.tipo === 'entrada'
        ? 'Entrada manual'
        : this.data.tipo === 'prestamo'
          ? 'Préstamo recibido'
          : 'Mover entre orígenes de fondos';

    if (this.data.tipo === 'entrada') {
      this.motivoService.findActivos().subscribe({
        next: (motivos) => {
          this.motivos = motivos.filter(
            (m) => m.categoria === 'BOLSILLO' || m.categoria === 'AJUSTE'
          );
        }
      });
    }

    if (this.data.tipo === 'prestamo') {
      this.form.get('terceroNombre')?.setValidators([Validators.required]);
      this.form.get('terceroNombre')?.updateValueAndValidity();
    }

    if (this.data.tipo === 'traslado') {
      this.form.get('origenDestinoId')?.setValidators([Validators.required]);
      this.form.get('origenDestinoId')?.updateValueAndValidity();
    }
  }

  ngAfterViewInit(): void {
    const origenPreseleccionado = this.data.cuentaId != null;
    const destinoPreseleccionado = this.data.destinoId != null;
    // Si origen y destino ya vienen preseleccionados (ej. arrastrar y soltar),
    // enviamos el foco directamente al campo Valor; de lo contrario, al Origen.
    const focarValor = origenPreseleccionado && destinoPreseleccionado;
    setTimeout(() => {
      if (focarValor) {
        this.valorInput?.nativeElement.focus();
      } else {
        this.origenSelect?.focus();
      }
    });
  }

  get esTraslado(): boolean {
    return this.data.tipo === 'traslado';
  }

  get esPrestamo(): boolean {
    return this.data.tipo === 'prestamo';
  }

  get esEntrada(): boolean {
    return this.data.tipo === 'entrada';
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fecha = this.toIsoDate(this.form.value.fecha);
    const valor = Number(this.form.value.valor);
    const observacion = this.form.value.observacion?.trim() || undefined;

    this.guardando = true;

    if (this.data.tipo === 'entrada') {
      const payload: MovimientoEntradaRequest = {
        origenFondosId: this.form.value.origenFondosId,
        valor,
        fecha,
        observacion,
        motivoMovimientoId: this.form.value.motivoMovimientoId ?? undefined
      };
      this.movimientoService
        .entradaManual(payload)
        .pipe(finalize(() => (this.guardando = false)))
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => this.mostrarError(err)
        });
      return;
    }

    if (this.data.tipo === 'prestamo') {
      const payload: MovimientoPrestamoRequest = {
        origenFondosId: this.form.value.origenFondosId,
        valor,
        fecha,
        terceroNombre: this.form.value.terceroNombre?.trim(),
        observacion
      };
      this.movimientoService
        .prestamo(payload)
        .pipe(finalize(() => (this.guardando = false)))
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => this.mostrarError(err)
        });
      return;
    }

    const origenId = this.form.value.origenFondosId;
    const destinoId = this.form.value.origenDestinoId;
    if (origenId === destinoId) {
      this.guardando = false;
      this.snackBar.open('Origen y destino deben ser distintos', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    const payload: MovimientoTrasladoRequest = {
      origenFondosId: origenId,
      origenDestinoId: destinoId,
      valor,
      fecha,
      observacion
    };
    this.movimientoService
      .traslado(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => this.mostrarError(err)
      });
  }

  private toIsoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private mostrarError(err: {
    error?: { message?: string; errores?: { descripcionError?: string }[] };
  }): void {
    const msg =
      err?.error?.errores?.[0]?.descripcionError ||
      err?.error?.message ||
      'No se pudo registrar el movimiento.';
    this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
  }
}
