import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CandidatoAmbiguoDto } from '../service/confirmacion-pago.service';

export interface AmbiguidadPagoDialogData {
  notificacionId: number;
  nombrePagador?: string | null;
  candidatos: CandidatoAmbiguoDto[];
  monto: number;
}

@Component({
  selector: 'app-ambiguidad-pago-dialog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Varias ventas con el mismo monto</h2>
    <mat-dialog-content>
      <p>
        Llegó un pago de
        <strong>{{ data.monto | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong>
        @if (data.nombrePagador) {
          de <strong>{{ data.nombrePagador }}</strong>
        }
        . Elige a qué ticket corresponde:
      </p>
      <div class="cands">
        @for (c of data.candidatos; track c.historialElectronicoId) {
          <button
            type="button"
            mat-stroked-button
            class="cand"
            (click)="choose(c.historialElectronicoId)">
            Ticket #{{ c.historialReciboId }} —
            {{ c.montoEsperado | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
          </button>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close(null)">Después</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .cands {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }
      .cand {
        justify-content: flex-start;
      }
    `
  ]
})
export class AmbiguidadPagoDialogComponent {
  constructor(
    public ref: MatDialogRef<AmbiguidadPagoDialogComponent, number | null>,
    @Inject(MAT_DIALOG_DATA) public data: AmbiguidadPagoDialogData
  ) {}

  choose(id: number): void {
    this.ref.close(id);
  }
}
