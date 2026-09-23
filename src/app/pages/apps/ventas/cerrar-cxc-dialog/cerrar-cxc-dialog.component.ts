import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CuentaPorCobrarDto } from '../service/cuenta-por-cobrar.service';

export type CerrarCxcModo = 'anular' | 'castigar';

export interface CerrarCxcDialogData {
  modo: CerrarCxcModo;
  cuenta: CuentaPorCobrarDto;
}

export interface CerrarCxcDialogResult {
  motivoTexto: string;
}

@Component({
  selector: 'vex-cerrar-cxc-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ modo === 'anular' ? 'Anular crédito' : 'Castigar cartera' }}
    </h2>
    <mat-dialog-content class="flex flex-col gap-3">
      <p class="hint m-0">
        {{ data.cuenta.clienteNombre || 'Cliente' }} · Saldo
        {{ formatMoney(data.cuenta.saldoPendiente) }}
      </p>
      @if (modo === 'anular') {
        <p class="hint m-0">
          Solo si no hay abonos. El ticket sigue abierto para cobrar de contado.
          Queda traza (no se borra el registro).
        </p>
      } @else {
        <p class="hint m-0">
          Irrecuperable: sale de inventario a costo, cierra el ticket. No es
          egreso de caja. Los abonos previos se conservan.
        </p>
      }
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Motivo</mat-label>
        <input
          matInput
          [(ngModel)]="motivoTexto"
          name="motivo"
          [required]="modo === 'castigar'"
          placeholder="Ej. cliente pagará de contado / deudor incobrable" />
      </mat-form-field>
      @if (error) {
        <p class="error-msg">{{ error }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">
        Cancelar
      </button>
      <button
        mat-flat-button
        [color]="modo === 'castigar' ? 'warn' : 'primary'"
        type="button"
        [disabled]="!canSubmit"
        (click)="confirmar()">
        {{ modo === 'anular' ? 'Anular' : 'Castigar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        font-size: 0.8125rem;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.35;
      }
      .error-msg {
        margin: 0;
        color: #c62828;
        font-size: 0.8125rem;
      }
    `
  ]
})
export class CerrarCxcDialogComponent {
  motivoTexto = '';
  error: string | null = null;

  private readonly moneyFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  constructor(
    public dialogRef: MatDialogRef<
      CerrarCxcDialogComponent,
      CerrarCxcDialogResult | undefined
    >,
    @Inject(MAT_DIALOG_DATA) public data: CerrarCxcDialogData
  ) {
    if (this.modo === 'anular') {
      this.motivoTexto = 'Cliente paga de contado / crédito abierto por error';
    }
  }

  get modo(): CerrarCxcModo {
    return this.data.modo;
  }

  get canSubmit(): boolean {
    if (this.modo === 'castigar') {
      return (this.motivoTexto ?? '').trim().length > 0;
    }
    return true;
  }

  formatMoney(n: number): string {
    return this.moneyFmt.format(Math.round(n || 0));
  }

  confirmar(): void {
    const texto = (this.motivoTexto ?? '').trim();
    if (this.modo === 'castigar' && !texto) {
      this.error = 'El motivo es obligatorio para castigar cartera.';
      return;
    }
    this.dialogRef.close({ motivoTexto: texto });
  }
}
