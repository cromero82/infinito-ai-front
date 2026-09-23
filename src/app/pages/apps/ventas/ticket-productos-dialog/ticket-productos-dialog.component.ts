import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  HistorialReciboDetalleDto,
  HistorialReciboDetalleService
} from '../service/historial-recibo-detalle.service';
import { SesionesService } from '../service/sesiones.service';

export interface TicketProductosDialogData {
  historialReciboId: number;
  titulo?: string;
  totalTicket?: number;
  /** Nombre del cajero/usuario que atendió (si ya se conoce). */
  atendidoNombre?: string | null;
  /** Si no hay atendidoNombre, se resuelve vía sesión. */
  sesionId?: number | null;
}

@Component({
  selector: 'vex-ticket-productos-dialog',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ticket-productos-dialog.component.html',
  styleUrls: ['./ticket-productos-dialog.component.scss']
})
export class TicketProductosDialogComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  detalles: HistorialReciboDetalleDto[] = [];
  atendidoNombre: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TicketProductosDialogData,
    private dialogRef: MatDialogRef<TicketProductosDialogComponent>,
    private detalleService: HistorialReciboDetalleService,
    private sesionesService: SesionesService
  ) {}

  ngOnInit(): void {
    const passed = (this.data.atendidoNombre || '').trim();
    if (passed) {
      this.atendidoNombre = passed;
    } else {
      this.resolveAtendido();
    }

    this.detalleService
      .getDetallesByReciboId(this.data.historialReciboId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.detalles = rows ?? [];
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar los productos.';
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nombreProducto(d: HistorialReciboDetalleDto): string {
    return d.producto?.nombre?.trim() || `Producto ${d.productoId}`;
  }

  get totalMostrar(): number {
    if (this.data.totalTicket != null && !Number.isNaN(Number(this.data.totalTicket))) {
      return Number(this.data.totalTicket);
    }
    return this.detalles.reduce((s, d) => s + Number(d.subtotal ?? 0), 0);
  }

  close(): void {
    this.dialogRef.close();
  }

  private resolveAtendido(): void {
    const sid = this.data.sesionId;
    if (sid == null || sid <= 0) {
      return;
    }
    this.sesionesService
      .getUsuarioBySesionId(sid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (u) => {
          const nombre = (u?.nombre ?? '').trim();
          if (nombre) {
            this.atendidoNombre = nombre;
          }
        }
      });
  }
}
