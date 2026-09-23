import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MovimientoOrigenFondosDto,
  MovimientoOrigenFondosService
} from '../service/movimiento-origen-fondos.service';
import {
  CLASIFICACIONES_OPERATIVAS,
  labelClasificacionOperativa
} from '../util/clasificacion-operativa.util';

@Component({
  selector: 'vex-clasificacion-operativa-reporte-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Reporte operativo por clasificación</h2>
    <mat-dialog-content class="reporte-content">
      <p class="hint">
        Movimientos con tag operativo (impacto +). Útil para dueño / anticipos /
        gastos antes del cierre de periodo.
      </p>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Clasificación</mat-label>
          <mat-select [formControl]="clasificacionCtrl">
            <mat-option [value]="''">Todas</mat-option>
            @for (c of clasificaciones; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Desde</mat-label>
          <input matInput [matDatepicker]="pDesde" [formControl]="desdeCtrl" />
          <mat-datepicker-toggle matIconSuffix [for]="pDesde"></mat-datepicker-toggle>
          <mat-datepicker #pDesde></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Hasta</mat-label>
          <input matInput [matDatepicker]="pHasta" [formControl]="hastaCtrl" />
          <mat-datepicker-toggle matIconSuffix [for]="pHasta"></mat-datepicker-toggle>
          <mat-datepicker #pHasta></mat-datepicker>
        </mat-form-field>
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="loading"
          (click)="cargar()">
          Consultar
        </button>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="totales">
          <strong>Total:</strong>
          {{ total | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
          <span class="count">({{ rows.length }} movimientos)</span>
        </div>
        <div class="table-wrap">
          <table mat-table [dataSource]="rows" class="reporte-table">
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let m">{{ m.fecha | date: 'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="clasificacion">
              <th mat-header-cell *matHeaderCellDef>Clasificación</th>
              <td mat-cell *matCellDef="let m">
                {{ label(m.clasificacionOperativa) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="cuenta">
              <th mat-header-cell *matHeaderCellDef>OF (destino)</th>
              <td mat-cell *matCellDef="let m">{{ m.origenFondosNombre || m.origenFondosId }}</td>
            </ng-container>
            <ng-container matColumnDef="valor">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let m">
                {{ m.valor | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="detalle">
              <th mat-header-cell *matHeaderCellDef>Detalle</th>
              <td mat-cell *matCellDef="let m">
                {{ m.observacion || m.origenTipo || '—' }}
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
          @if (rows.length === 0) {
            <p class="empty">Sin movimientos clasificados en el rango.</p>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .reporte-content {
        min-width: min(860px, 90vw);
        max-height: 70vh;
      }
      .hint {
        margin: 0 0 12px;
        font-size: 0.8rem;
        opacity: 0.75;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-bottom: 12px;
      }
      .filters mat-form-field {
        width: 180px;
      }
      .loading {
        display: flex;
        justify-content: center;
        padding: 32px;
      }
      .totales {
        margin-bottom: 8px;
        font-size: 0.95rem;
      }
      .count {
        margin-left: 8px;
        opacity: 0.65;
        font-weight: 400;
      }
      .table-wrap {
        overflow: auto;
        max-height: 48vh;
      }
      .reporte-table {
        width: 100%;
      }
      .empty {
        padding: 16px;
        opacity: 0.7;
      }
    `
  ]
})
export class ClasificacionOperativaReporteDialogComponent implements OnInit {
  clasificaciones = CLASIFICACIONES_OPERATIVAS;
  clasificacionCtrl = new FormControl<string>('', { nonNullable: true });
  desdeCtrl = new FormControl<Date | null>(null);
  hastaCtrl = new FormControl<Date | null>(null);
  rows: MovimientoOrigenFondosDto[] = [];
  total = 0;
  loading = false;
  columns = ['fecha', 'clasificacion', 'cuenta', 'valor', 'detalle'];

  constructor(
    private movimientoService: MovimientoOrigenFondosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(hasta.getDate() - 30);
    this.desdeCtrl.setValue(desde);
    this.hastaCtrl.setValue(hasta);
    this.cargar();
  }

  label(codigo: string | null | undefined): string {
    return labelClasificacionOperativa(codigo);
  }

  cargar(): void {
    const desde = this.desdeCtrl.value;
    const hasta = this.hastaCtrl.value;
    if (!desde || !hasta) {
      this.snackBar.open('Indique desde y hasta', 'Cerrar', { duration: 3000 });
      return;
    }
    this.loading = true;
    const clasif = this.clasificacionCtrl.value || undefined;
    this.movimientoService
      .findPorClasificacion(this.toIso(desde), this.toIso(hasta), clasif)
      .subscribe({
        next: (list) => {
          this.rows = list || [];
          this.total = this.rows.reduce((s, m) => s + (Number(m.valor) || 0), 0);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open(
            'No se pudo cargar el reporte (¿BE actualizado?)',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
