import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  AbonoCxcDto,
  CuentaPorCobrarDto,
  CuentaPorCobrarService,
  RegistrarAbonoCxcRequest
} from '../service/cuenta-por-cobrar.service';
import {
  MetodoPagoDto,
  MetodoPagoService
} from '../service/metodo-pago.service';

export interface RegistrarAbonoCxcDialogData {
  cuenta: CuentaPorCobrarDto;
  /** Sesión de caja activa (panel QR). */
  sesionId?: number | null;
}

export interface RegistrarAbonoCxcDialogResult {
  abono: AbonoCxcDto;
  cuenta: CuentaPorCobrarDto;
}

@Component({
  selector: 'vex-registrar-abono-cxc-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Registrar abono</h2>
    <mat-dialog-content class="flex flex-col gap-3">
      <p class="hint m-0">
        {{ data.cuenta.clienteNombre || 'Cliente' }} · Saldo
        {{ formatMoney(saldoPendiente) }}
      </p>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Monto del abono</mat-label>
        <input
          matInput
          type="text"
          inputmode="numeric"
          [(ngModel)]="montoDisplay"
          name="monto"
          (focus)="onMontoFocus()"
          (blur)="onMontoBlur()"
          (input)="onMontoInput($event)" />
        <mat-hint>Máximo {{ formatMoney(saldoPendiente) }}</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Medio de pago</mat-label>
        <mat-select [(ngModel)]="metodoPagoId" name="metodoPago" required>
          @for (mp of metodos; track mp.id) {
            <mat-option [value]="mp.id">{{ mp.descripcion }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Observación (opcional)</mat-label>
        <input matInput [(ngModel)]="observacion" name="observacion" />
      </mat-form-field>

      @if (error) {
        <p class="error-msg">{{ error }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="saving" (click)="cancelar()">
        Cancelar
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!canSubmit || saving"
        (click)="confirmar()">
        @if (saving) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          Registrar abono
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        font-size: 0.8125rem;
        color: rgba(0, 0, 0, 0.6);
      }
      .error-msg {
        margin: 0;
        color: #c62828;
        font-size: 0.8125rem;
      }
      mat-spinner {
        display: inline-block;
      }
    `
  ]
})
export class RegistrarAbonoCxcDialogComponent implements OnInit {
  metodos: MetodoPagoDto[] = [];
  metodoPagoId: number | null = null;
  montoDisplay = '';
  montoValue = 0;
  observacion = '';
  saving = false;
  error: string | null = null;

  private readonly moneyFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  constructor(
    private dialogRef: MatDialogRef<
      RegistrarAbonoCxcDialogComponent,
      RegistrarAbonoCxcDialogResult | undefined
    >,
    @Inject(MAT_DIALOG_DATA) public data: RegistrarAbonoCxcDialogData,
    private cxcService: CuentaPorCobrarService,
    private metodoPagoService: MetodoPagoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.metodoPagoService.obtenerMetodosPagoParaTickets().subscribe({
      next: (list) => {
        this.metodos = list ?? [];
        const efectivo = this.metodos.find((m) =>
          (m.descripcion || '').toLowerCase().includes('efectivo')
        );
        this.metodoPagoId = efectivo?.id ?? this.metodos[0]?.id ?? null;
      }
    });
    this.montoValue = this.saldoPendiente;
    this.montoDisplay = this.formatDigits(this.montoValue);
  }

  get saldoPendiente(): number {
    return Math.max(0, Math.round(Number(this.data.cuenta.saldoPendiente) || 0));
  }

  get canSubmit(): boolean {
    return (
      this.metodoPagoId != null &&
      this.montoValue > 0 &&
      this.montoValue <= this.saldoPendiente
    );
  }

  formatMoney(n: number): string {
    return this.moneyFmt.format(Math.round(n || 0));
  }

  private formatDigits(n: number): string {
    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0
    }).format(Math.round(n || 0));
  }

  private parseMoney(raw: string): number {
    const digits = String(raw ?? '').replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }

  onMontoFocus(): void {
    this.montoDisplay = String(Math.round(this.montoValue || 0));
  }

  onMontoInput(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(
      /[^\d]/g,
      ''
    );
    this.montoDisplay = digits;
    this.montoValue = digits ? Number(digits) : 0;
  }

  onMontoBlur(): void {
    this.montoValue = this.parseMoney(this.montoDisplay);
    if (this.montoValue > this.saldoPendiente) {
      this.montoValue = this.saldoPendiente;
    }
    this.montoDisplay = this.formatDigits(this.montoValue);
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    if (!this.canSubmit || this.metodoPagoId == null) {
      return;
    }
    this.saving = true;
    this.error = null;
    const body: RegistrarAbonoCxcRequest = {
      monto: this.montoValue,
      metodoPagoId: this.metodoPagoId,
      observacion: (this.observacion ?? '').trim() || null,
      sesionId: this.data.sesionId ?? null
    };
    this.cxcService.registrarAbono(this.data.cuenta.id, body).subscribe({
      next: (abono) => {
        this.cxcService.findById(this.data.cuenta.id).subscribe({
          next: (cuenta) => {
            this.saving = false;
            this.snackBar.open(
              cuenta.estado === 'PAGADA'
                ? `Abono ${this.formatMoney(abono.monto)} · crédito liquidado (ticket cerrado)`
                : `Abono ${this.formatMoney(abono.monto)} registrado`,
              'Cerrar',
              { duration: 3500 }
            );
            this.dialogRef.close({ abono, cuenta });
          },
          error: () => {
            this.saving = false;
            const saldoNuevo = Math.max(
              0,
              this.saldoPendiente - this.montoValue
            );
            const estado =
              saldoNuevo <= 0 ? 'PAGADA' : 'PARCIAL';
            this.snackBar.open(
              estado === 'PAGADA'
                ? `Abono ${this.formatMoney(abono.monto)} · crédito liquidado (ticket cerrado)`
                : `Abono ${this.formatMoney(abono.monto)} registrado`,
              'Cerrar',
              { duration: 3500 }
            );
            this.dialogRef.close({
              abono,
              cuenta: {
                ...this.data.cuenta,
                saldoPendiente: saldoNuevo,
                estado
              }
            });
          }
        });
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.error =
          err?.error?.message || err?.message || 'No se pudo registrar el abono';
      }
    });
  }
}
