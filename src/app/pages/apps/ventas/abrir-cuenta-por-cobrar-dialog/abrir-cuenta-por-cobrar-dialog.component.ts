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
import { ClienteDto, ClienteService } from '../service/cliente.service';
import { ClienteSelectorComponent } from '../cliente-selector/cliente-selector.component';
import {
  AbrirCuentaPorCobrarRequest,
  CuentaPorCobrarDto,
  CuentaPorCobrarService
} from '../service/cuenta-por-cobrar.service';
import {
  MetodoPagoDto,
  MetodoPagoService
} from '../service/metodo-pago.service';
import { TicketDto } from '../service/tickets.service';

const CLIENTE_ANONIMO_ID = 1;

export interface AbrirCuentaPorCobrarDialogData {
  ticket: TicketDto;
  reciboId: number;
  /** Total del ticket (suma productos / TOTAL UI). */
  totalRecibo: number;
  /** Ya cobrado en el recibo (si aplica). */
  montoRecibido?: number;
  /** Sesión de caja activa (panel QR abono inicial). */
  sesionId?: number | null;
  /**
   * Faltante QR: abono/saldo/medio fijos (email ya confirmado).
   * El cajero solo identifica cliente y pulsa Crear crédito.
   */
  bloquearMontos?: boolean;
  abonoFijo?: number;
  saldoFijo?: number;
  metodoPagoIdFijo?: number | null;
  /** HRE CONFIRMADA a retargetar al abono inicial. */
  historialElectronicoId?: number | null;
}

@Component({
  selector: 'vex-abrir-cuenta-por-cobrar-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ClienteSelectorComponent
  ],
  template: `
    <h2 mat-dialog-title>Abrir cuenta por cobrar</h2>
    <mat-dialog-content class="flex flex-col gap-3">
      <p class="text-secondary hint m-0">
        @if (montosBloqueados) {
          Ticket «{{ data.ticket.nombre }}». El abono es el monto confirmado del
          email QR; el saldo a crédito es el faltante. Identifique al cliente y
          cree el crédito.
        } @else {
          Ticket «{{ data.ticket.nombre }}». Indique cuánto abona ahora y cuánto
          queda debiendo (saldo a crédito). El crédito puede crecer si siguen
          agregando productos al ticket.
        }
      </p>

      <div class="resumen-box">
        <div class="resumen-row">
          <span>Total ticket</span>
          <strong>{{ formatMoney(totalTicket) }}</strong>
        </div>
      </div>

      <div class="cliente-block">
        <label class="field-label">Cliente</label>
        <cliente-selector
          [initialClienteId]="clienteId"
          (clienteSelected)="onClienteSelected($event)">
        </cliente-selector>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Teléfono</mat-label>
        <input matInput [(ngModel)]="telefono" name="telefono" required />
        @if (!telefonoTrim) {
          <mat-hint>Obligatorio para abrir crédito</mat-hint>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Correo (opcional)</mat-label>
        <input
          matInput
          type="email"
          [(ngModel)]="correo"
          name="correo"
          placeholder="para recordatorios / comprobante" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Abono (ahora)</mat-label>
        <input
          matInput
          type="text"
          inputmode="numeric"
          [(ngModel)]="abonoDisplay"
          name="abono"
          [disabled]="montosBloqueados"
          (focus)="onMoneyFocus('abono')"
          (blur)="onMoneyBlur('abono')"
          (input)="onMoneyInput('abono', $event)" />
        <mat-hint>
          @if (montosBloqueados) {
            Monto recibido del email QR (no editable).
          } @else {
            0 = todo a crédito. Lo que paga de contado ahora.
          }
        </mat-hint>
      </mat-form-field>

      @if (abonoValue > 0) {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Medio de pago del abono</mat-label>
          <mat-select
            [(ngModel)]="metodoPagoId"
            name="metodoPago"
            [disabled]="montosBloqueados"
            required>
            @for (mp of metodos; track mp.id) {
              <mat-option [value]="mp.id">{{ mp.descripcion }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Saldo (Monto a crédito)</mat-label>
        <input
          matInput
          type="text"
          inputmode="numeric"
          [(ngModel)]="saldoDisplay"
          name="saldo"
          [disabled]="montosBloqueados"
          (focus)="onMoneyFocus('saldo')"
          (blur)="onMoneyBlur('saldo')"
          (input)="onMoneyInput('saldo', $event)" />
        <mat-hint>
          @if (montosBloqueados) {
            Faltante del pago QR (no editable).
          } @else {
            Lo que queda debiendo. Abono + saldo =
            {{ formatMoney(totalTicket) }}
          }
        </mat-hint>
      </mat-form-field>

      <div class="resumen-box resumen-box--ok">
        <div class="resumen-row">
          <span>Abono</span>
          <span>{{ formatMoney(abonoValue) }}</span>
        </div>
        <div class="resumen-row">
          <span>Saldo (Monto a crédito)</span>
          <strong>{{ formatMoney(saldoValue) }}</strong>
        </div>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Observación (opcional)</mat-label>
        <input matInput [(ngModel)]="observacion" name="observacion" />
      </mat-form-field>

      @if (error) {
        <p class="error-msg">{{ error }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (!montosBloqueados) {
        <button mat-button type="button" [disabled]="saving" (click)="cancelar()">
          Cancelar
        </button>
      }
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!canSubmit || saving"
        (click)="confirmar()">
        @if (saving) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          Crear crédito
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        font-size: 0.8125rem;
        line-height: 1.35;
        margin-bottom: 4px !important;
      }
      .field-label {
        display: block;
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 4px;
      }
      .cliente-block {
        margin-bottom: 4px;
      }
      .resumen-box {
        padding: 10px 12px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.04);
        font-size: 0.875rem;
      }
      .resumen-box--ok {
        background: rgba(46, 125, 50, 0.08);
      }
      .resumen-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        line-height: 1.5;
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
export class AbrirCuentaPorCobrarDialogComponent implements OnInit {
  clienteId: number | null = null;
  clienteNombre = '';
  telefono = '';
  correo = '';
  documento = '';
  observacion = '';
  abonoDisplay = '';
  saldoDisplay = '';
  abonoValue = 0;
  saldoValue = 0;
  metodos: MetodoPagoDto[] = [];
  metodoPagoId: number | null = null;
  /** Quién se editó por último para recalcular el otro. */
  private lastEdited: 'abono' | 'saldo' = 'abono';
  saving = false;
  error: string | null = null;

  private readonly moneyFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  constructor(
    private dialogRef: MatDialogRef<
      AbrirCuentaPorCobrarDialogComponent,
      CuentaPorCobrarDto | undefined
    >,
    @Inject(MAT_DIALOG_DATA) public data: AbrirCuentaPorCobrarDialogData,
    private cuentaPorCobrarService: CuentaPorCobrarService,
    private clienteService: ClienteService,
    private metodoPagoService: MetodoPagoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const c = this.data.ticket.cliente;
    if (c && c.id !== CLIENTE_ANONIMO_ID) {
      this.clienteId = c.id;
      this.clienteNombre = c.nombre ?? '';
      this.telefono = c.telefono ?? '';
      this.documento = c.documento ?? '';
      this.clienteService.getClienteById(c.id).subscribe({
        next: (full) => {
          this.telefono = full.telefono ?? this.telefono;
          this.correo = full.correo ?? '';
          this.documento = full.documento ?? this.documento;
          this.clienteNombre = full.nombre ?? this.clienteNombre;
        }
      });
    }
    this.metodoPagoService.obtenerMetodosPagoParaTickets().subscribe({
      next: (list) => {
        this.metodos = list ?? [];
        if (this.data.metodoPagoIdFijo != null) {
          this.metodoPagoId = this.data.metodoPagoIdFijo;
        } else {
          const efectivo = this.metodos.find((m) =>
            (m.descripcion || '').toLowerCase().includes('efectivo')
          );
          this.metodoPagoId = efectivo?.id ?? this.metodos[0]?.id ?? null;
        }
      }
    });
    if (this.montosBloqueados) {
      this.abonoValue = Math.max(
        0,
        Math.round(Number(this.data.abonoFijo ?? this.data.montoRecibido ?? 0))
      );
      this.saldoValue = Math.max(
        0,
        Math.round(
          Number(
            this.data.saldoFijo ??
              Math.max(0, this.totalTicket - this.abonoValue)
          )
        )
      );
      this.lastEdited = 'abono';
    } else {
      // Default: sin abono → todo a crédito (caso más común al abrir CxC).
      this.abonoValue = 0;
      this.saldoValue = this.totalTicket;
    }
    this.abonoDisplay = this.formatDigits(this.abonoValue);
    this.saldoDisplay = this.formatDigits(this.saldoValue);
  }

  get montosBloqueados(): boolean {
    return !!this.data.bloquearMontos;
  }

  get totalTicket(): number {
    return Math.max(0, Math.round(Number(this.data.totalRecibo) || 0));
  }

  get telefonoTrim(): string {
    return (this.telefono ?? '').trim();
  }

  get canSubmit(): boolean {
    const suma = this.abonoValue + this.saldoValue;
    const medioOk = this.abonoValue <= 0 || this.metodoPagoId != null;
    return (
      this.clienteId != null &&
      this.clienteId !== CLIENTE_ANONIMO_ID &&
      this.telefonoTrim.length > 0 &&
      this.saldoValue > 0 &&
      this.abonoValue >= 0 &&
      medioOk &&
      suma <= this.totalTicket + 0.01 &&
      this.totalTicket > 0
    );
  }

  onClienteSelected(cliente: ClienteDto | null): void {
    this.error = null;
    if (!cliente || cliente.id === CLIENTE_ANONIMO_ID) {
      this.clienteId = null;
      this.clienteNombre = '';
      return;
    }
    this.clienteId = cliente.id;
    this.clienteNombre = cliente.nombre ?? '';
    this.telefono = cliente.telefono ?? this.telefono;
    this.documento = cliente.documento ?? this.documento;
    this.correo = cliente.correo ?? this.correo;
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

  onMoneyFocus(field: 'abono' | 'saldo'): void {
    if (this.montosBloqueados) {
      return;
    }
    this.lastEdited = field;
    if (field === 'abono') {
      this.abonoDisplay = String(Math.round(this.abonoValue || 0));
    } else {
      this.saldoDisplay = String(Math.round(this.saldoValue || 0));
    }
  }

  onMoneyInput(field: 'abono' | 'saldo', event: Event): void {
    if (this.montosBloqueados) {
      return;
    }
    const digits = (event.target as HTMLInputElement).value.replace(
      /[^\d]/g,
      ''
    );
    const n = digits ? Number(digits) : 0;
    this.lastEdited = field;
    if (field === 'abono') {
      this.abonoDisplay = digits;
      this.abonoValue = n;
      this.saldoValue = Math.max(0, this.totalTicket - this.abonoValue);
      this.saldoDisplay = this.formatDigits(this.saldoValue);
    } else {
      this.saldoDisplay = digits;
      this.saldoValue = n;
      this.abonoValue = Math.max(0, this.totalTicket - this.saldoValue);
      this.abonoDisplay = this.formatDigits(this.abonoValue);
    }
  }

  onMoneyBlur(field: 'abono' | 'saldo'): void {
    if (this.montosBloqueados) {
      return;
    }    if (field === 'abono') {
      this.abonoValue = this.parseMoney(this.abonoDisplay);
      if (this.abonoValue > this.totalTicket) {
        this.abonoValue = this.totalTicket;
      }
      this.saldoValue = Math.max(0, this.totalTicket - this.abonoValue);
    } else {
      this.saldoValue = this.parseMoney(this.saldoDisplay);
      if (this.saldoValue > this.totalTicket) {
        this.saldoValue = this.totalTicket;
      }
      this.abonoValue = Math.max(0, this.totalTicket - this.saldoValue);
    }
    this.abonoDisplay = this.formatDigits(this.abonoValue);
    this.saldoDisplay = this.formatDigits(this.saldoValue);
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  confirmar(): void {
    if (!this.canSubmit || this.clienteId == null) {
      return;
    }
    this.saving = true;
    this.error = null;
    const body: AbrirCuentaPorCobrarRequest = {
      ticketId: this.data.ticket.id,
      reciboId: this.data.reciboId,
      clienteId: this.clienteId,
      clienteNombre: this.clienteNombre || null,
      telefono: this.telefonoTrim,
      correo: (this.correo ?? '').trim() || null,
      documento: (this.documento ?? '').trim() || null,
      totalTicket: this.totalTicket,
      abono: this.abonoValue,
      metodoPagoId: this.abonoValue > 0 ? this.metodoPagoId : null,
      monto: this.saldoValue,
      observacion: (this.observacion ?? '').trim() || null,
      sesionId: this.data.sesionId ?? null,
      historialElectronicoId: this.data.historialElectronicoId ?? null
    };
    this.cuentaPorCobrarService.abrir(body).subscribe({
      next: (dto) => {
        this.saving = false;
        this.snackBar.open(
          `Crédito abierto: saldo ${this.formatMoney(dto.saldoPendiente)}`,
          'Cerrar',
          { duration: 4000 }
        );
        this.dialogRef.close(dto);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.error =
          err?.error?.message ||
          err?.message ||
          'No se pudo abrir la cuenta por cobrar';
      }
    });
  }
}
