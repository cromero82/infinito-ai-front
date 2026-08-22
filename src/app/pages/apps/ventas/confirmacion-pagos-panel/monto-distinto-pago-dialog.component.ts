import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MontoDistintoConfirmacionDto } from '../service/confirmacion-pago.service';
import {
  OrigenFondosDto,
  OrigenFondosService
} from '../../financiero/origenes-fondos/service/origen-fondos.service';

export type MontoDistintoDialogData = MontoDistintoConfirmacionDto;

export interface MontoDistintoDialogResult {
  confirmed: true;
  origenFondosDevolucionId?: number | null;
}

@Component({
  selector: 'app-monto-distinto-pago-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Monto distinto al esperado</h2>
    <mat-dialog-content>
      <p class="intro">
        @if (data.nombrePagador) {
          Pago de <strong>{{ data.nombrePagador }}</strong>.
        }
        El email no coincide con el monto del ticket/abono QR.
      </p>
      <dl class="montos">
        <div>
          <dt>Esperado</dt>
          <dd>{{ data.montoEsperado | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</dd>
        </div>
        <div>
          <dt>Recibido (email)</dt>
          <dd>{{ data.montoRecibido | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</dd>
        </div>
        <div [class.diff-plus]="diferencia > 0" [class.diff-minus]="diferencia < 0">
          <dt>Diferencia</dt>
          <dd>
            {{ diferencia > 0 ? '+' : ''
            }}{{ diferencia | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
          </dd>
        </div>
      </dl>

      @if (esSobrepago) {
        <p class="regla">
          El banco recibió de más. Ese sobrepago entra al OF del medio QR y la
          <strong>devolución en efectivo</strong> debe salir de un origen de fondos
          (normalmente caja).
        </p>
        <mat-form-field appearance="outline" class="of-field" subscriptSizing="dynamic">
          <mat-label>OF de la devolución</mat-label>
          <mat-select [(ngModel)]="origenFondosDevolucionId" name="ofDevolucion">
            @for (o of origenes; track o.id) {
              <mat-option [value]="o.id">{{ o.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      } @else {
        <p class="regla">
          El banco recibió de menos. Se <strong>reabrirá el ticket</strong> y
          podrá abrir el crédito con «Generar crédito»: abono = lo recibido
          (fijo) y saldo = faltante. Identifique al cliente y confirme.
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close(null)">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!canConfirm"
        (click)="confirmar()">
        Confirmar asociación
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .intro {
        margin: 0 0 12px;
      }
      .montos {
        display: grid;
        gap: 8px;
        margin: 0 0 12px;
      }
      .montos > div {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      dt {
        margin: 0;
        opacity: 0.7;
      }
      dd {
        margin: 0;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .diff-plus dd {
        color: #2e7d32;
      }
      .diff-minus dd {
        color: #c62828;
      }
      .regla {
        margin: 0 0 12px;
        font-size: 13px;
        line-height: 1.4;
        opacity: 0.85;
      }
      .of-field {
        width: 100%;
      }
    `
  ]
})
export class MontoDistintoPagoDialogComponent implements OnInit {
  readonly diferencia: number;
  readonly esSobrepago: boolean;
  origenFondosDevolucionId: number | null = null;
  origenes: OrigenFondosDto[] = [];

  constructor(
    public ref: MatDialogRef<
      MontoDistintoPagoDialogComponent,
      MontoDistintoDialogResult | null
    >,
    @Inject(MAT_DIALOG_DATA) public data: MontoDistintoDialogData,
    private origenFondosService: OrigenFondosService
  ) {
    this.diferencia = Number(data.diferencia) || 0;
    this.esSobrepago = this.diferencia > 0;
  }

  ngOnInit(): void {
    if (!this.esSobrepago) {
      return;
    }
    this.origenFondosService.findParaEgreso().subscribe({
      next: (list) => {
        this.origenes = (list || []).filter((o) => o.activo !== false);
        const caja =
          this.origenes.find((o) =>
            (o.nombre || '').toLowerCase().includes('caja')
          ) ||
          this.origenes.find((o) =>
            (o.nombre || '').toLowerCase().includes('efectivo')
          ) ||
          this.origenes[0];
        if (caja) {
          this.origenFondosDevolucionId = caja.id;
        }
      }
    });
  }

  get canConfirm(): boolean {
    if (this.esSobrepago) {
      return this.origenFondosDevolucionId != null;
    }
    return true;
  }

  confirmar(): void {
    if (!this.canConfirm) {
      return;
    }
    this.ref.close({
      confirmed: true,
      origenFondosDevolucionId: this.esSobrepago
        ? this.origenFondosDevolucionId
        : null
    });
  }
}
