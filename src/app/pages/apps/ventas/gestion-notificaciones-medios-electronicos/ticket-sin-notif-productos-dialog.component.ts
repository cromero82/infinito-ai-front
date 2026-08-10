import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  HistorialReciboDetalleDto,
  HistorialReciboDetalleService
} from '../service/historial-recibo-detalle.service';

export interface TicketSinNotifProductosDialogData {
  historialReciboId: number;
  numeroVenta?: string | null;
  total?: number | null;
}

@Component({
  selector: 'app-ticket-sin-notif-productos-dialog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Productos {{ data.numeroVenta ? '· ' + data.numeroVenta : '' }}</h2>
    <mat-dialog-content>
      @if (cargando) {
        <mat-spinner diameter="32"></mat-spinner>
      } @else if (detalles.length === 0) {
        <p class="empty">No hay productos para este recibo.</p>
      } @else {
        <table class="prod-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="num">Cant.</th>
              <th class="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (d of detalles; track d.id) {
              <tr>
                <td>{{ d.producto?.nombre || ('Producto ' + d.productoId) }}</td>
                <td class="num">{{ d.cantidad }}</td>
                <td class="num">{{ d.subtotal | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="prod-total">
          <span>Total</span>
          <strong>{{ total | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .prod-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .prod-table th,
      .prod-table td {
        padding: 6px 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        text-align: left;
      }
      .prod-table .num {
        text-align: right;
        white-space: nowrap;
      }
      .prod-total {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-top: 12px;
        padding: 10px 8px 2px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
        font-size: 14px;
      }
      .empty {
        margin: 8px 0;
        color: rgba(0, 0, 0, 0.54);
      }
    `
  ]
})
export class TicketSinNotifProductosDialogComponent implements OnInit {
  detalles: HistorialReciboDetalleDto[] = [];
  cargando = true;

  get total(): number {
    if (this.data.total != null && !Number.isNaN(Number(this.data.total))) {
      return Number(this.data.total);
    }
    return this.detalles.reduce((acc, d) => acc + Number(d.subtotal || 0), 0);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TicketSinNotifProductosDialogData,
    private detalleApi: HistorialReciboDetalleService
  ) {}

  ngOnInit(): void {
    this.detalleApi.getDetallesByReciboId(this.data.historialReciboId).subscribe({
      next: (list) => {
        this.detalles = list || [];
        this.cargando = false;
      },
      error: () => {
        this.detalles = [];
        this.cargando = false;
      }
    });
  }
}
