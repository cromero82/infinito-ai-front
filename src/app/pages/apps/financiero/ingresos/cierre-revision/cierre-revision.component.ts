import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import {
  CorteVentaDetalleDto,
  CorteVentaSearchItemDto,
  CorteVentaService,
  DetalleRevisionRequest,
  EstadoRevisionCorte
} from '../../../ventas/service/corte-venta.service';
import {
  MetodoPagoDto,
  MetodoPagoService
} from '../../../ventas/service/metodo-pago.service';
import {
  MotivoMovimientoDto,
  MotivoMovimientoService
} from '../../origenes-fondos/service/motivo-movimiento.service';

interface RevisionRow {
  detalle: CorteVentaDetalleDto;
  totalCtrl: FormControl<number | null>;
  motivoCtrl: FormControl<number | null>;
  comentarioCtrl: FormControl<string>;
  revisionEstado: EstadoRevisionCorte;
}

@Component({
  selector: 'vex-cierre-revision',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './cierre-revision.component.html',
  styleUrls: ['./cierre-revision.component.scss']
})
export class CierreRevisionComponent implements OnInit {
  corte: CorteVentaSearchItemDto | null = null;
  rows: RevisionRow[] = [];
  metodos = new Map<number, MetodoPagoDto>();
  motivos: MotivoMovimientoDto[] = [];
  loading = true;
  saving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { corteId: number },
    private dialogRef: MatDialogRef<CierreRevisionComponent, boolean>,
    private corteService: CorteVentaService,
    private metodoPagoService: MetodoPagoService,
    private motivoService: MotivoMovimientoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    forkJoin({
      corte: this.corteService.obtenerPorId(this.data.corteId),
      metodos: this.metodoPagoService.obtenerMetodosPago(),
      motivos: this.motivoService.findActivos()
    }).subscribe({
      next: ({ corte, metodos, motivos }) => {
        this.corte = corte;
        this.metodos = new Map((metodos ?? []).map((m) => [Number(m.id), m]));
        const todos = motivos ?? [];
        this.motivos = todos.filter((m) => m.categoria === 'DESFASE_CIERRE');
        if (this.motivos.length === 0) {
          this.motivos = todos.filter((m) => m.categoria === 'AJUSTE');
        }
        this.rows = (corte.detalles ?? []).map((detalle) => this.buildRow(detalle));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudo cargar el cierre', 'Cerrar', {
          duration: 4000
        });
        this.dialogRef.close(false);
      }
    });
  }

  private buildRow(detalle: CorteVentaDetalleDto): RevisionRow {
    const editable = detalle.modoCaptura === 'SOLO_VISIBLE';
    const totalCtrl = new FormControl<number | null>(detalle.total ?? null, [
      Validators.required,
      Validators.min(0)
    ]);
    const motivoCtrl = new FormControl<number | null>(
      detalle.motivoDesfaseId ?? null
    );
    if (!editable) {
      totalCtrl.disable();
      motivoCtrl.disable();
    }
    return {
      detalle,
      totalCtrl,
      motivoCtrl,
      comentarioCtrl: new FormControl<string>(
        detalle.revisionComentario ?? '',
        { nonNullable: true }
      ),
      revisionEstado: detalle.revisionEstado ?? 'PENDIENTE'
    };
  }

  nombreMetodo(id: number): string {
    return this.metodos.get(Number(id))?.descripcion ?? `Método ${id}`;
  }

  esEditable(row: RevisionRow): boolean {
    return row.detalle.modoCaptura === 'SOLO_VISIBLE';
  }

  desfase(row: RevisionRow): number | null {
    const total = row.totalCtrl.getRawValue();
    return total === null ? null : Number(total) - Number(row.detalle.totalSistema);
  }

  seleccionarRevision(row: RevisionRow, estado: 'OK' | 'SUGERENCIA'): void {
    row.revisionEstado = estado;
    if (estado === 'OK') {
      row.comentarioCtrl.setValue('');
    }
  }

  puedeFinalizar(): boolean {
    if (!this.corte || this.corte.estado !== 'creada' || this.rows.length === 0) {
      return false;
    }
    return this.rows.every((row) => {
      if (row.revisionEstado === 'PENDIENTE') return false;
      if (
        row.revisionEstado === 'SUGERENCIA' &&
        !row.comentarioCtrl.value.trim()
      ) {
        return false;
      }
      if (this.esEditable(row)) {
        const total = row.totalCtrl.getRawValue();
        if (total === null || total < 0) return false;
        if (this.desfase(row) !== 0 && !row.motivoCtrl.getRawValue()) return false;
      }
      return true;
    });
  }

  finalizar(): void {
    if (!this.puedeFinalizar() || !this.corte) return;
    const detalles: DetalleRevisionRequest[] = this.rows.map((row) => ({
      detalleId: row.detalle.id!,
      total: this.esEditable(row) ? row.totalCtrl.getRawValue() : null,
      motivoDesfaseId: this.esEditable(row)
        ? row.motivoCtrl.getRawValue()
        : null,
      revisionEstado: row.revisionEstado as 'OK' | 'SUGERENCIA',
      revisionComentario:
        row.revisionEstado === 'SUGERENCIA'
          ? row.comentarioCtrl.value.trim()
          : null
    }));
    this.saving = true;
    this.corteService.finalizarRevision(this.corte.id, detalles).subscribe({
      next: () => {
        this.snackBar.open('Revisión finalizada', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(
          err?.error?.message ?? 'No se pudo finalizar la revisión',
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }
}
