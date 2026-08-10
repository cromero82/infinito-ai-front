import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {
  GestionNotificacionesMediosService,
  NotificacionEmailPagoDto
} from '../service/gestion-notificaciones-medios.service';

@Component({
  selector: 'app-notificacion-email-detalle-dialog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.asunto || 'Notificación' }}</h2>
    <mat-dialog-content class="detalle">
      @if (data.plantillaNombre || data.plantillaIcono) {
        <p class="plantilla-row">
          @if (data.plantillaIcono) {
            <img [src]="iconoUrl(data.plantillaIcono)" alt="" width="28" height="28" />
          }
          <strong>{{ data.plantillaNombre || 'Plantilla' }}</strong>
        </p>
      }
      <p><strong>Recibido:</strong> {{ data.recibidoEn | date: 'dd/MM/yyyy HH:mm:ss' }}</p>
      <p><strong>Estado:</strong> {{ data.estadoVista }}</p>
      <p><strong>Monto:</strong> {{ data.monto != null ? (data.monto | currency: 'COP' : 'symbol-narrow' : '1.0-0') : '—' }}</p>
      <p><strong>Pagador:</strong> {{ data.nombrePagador || '—' }}</p>
      <p><strong>Cuenta:</strong> {{ data.referenciaCuenta || '—' }}</p>
      <p><strong>Message-ID:</strong> {{ data.messageId || '—' }}</p>
      <pre class="cuerpo">{{ data.cuerpoTexto || data.cuerpoRaw || '(sin cuerpo)' }}</pre>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .detalle {
        max-width: 640px;
      }
      .plantilla-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .plantilla-row img {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }
      .cuerpo {
        white-space: pre-wrap;
        word-break: break-word;
        background: #f4f5f7;
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        max-height: 40vh;
        overflow: auto;
      }
    `
  ]
})
export class NotificacionEmailDetalleDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NotificacionEmailPagoDto,
    private api: GestionNotificacionesMediosService
  ) {}

  iconoUrl(filename?: string | null): string {
    return this.api.iconoUrl(filename);
  }
}
