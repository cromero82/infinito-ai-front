import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertaEgresoSinVincularService } from '../../../pages/apps/ventas/service/alerta-egreso-sin-vincular.service';
import { abrirAlertaEgresoSinVincularDialog } from '../../../pages/apps/ventas/gestion-notificaciones-medios-electronicos/alerta-egreso-sin-vincular-dialog.component';

@Component({
  selector: 'app-toolbar-alerta-egreso',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    @if (count > 0) {
      <button
        type="button"
        mat-icon-button
        class="alerta-egreso-btn"
        [class.titila]="count > 0"
        matTooltip="Notificación de pago: QR y posible egreso no relacionado"
        aria-label="Notificación de pago: QR y posible egreso no relacionado"
        (click)="abrir()">
        <mat-icon svgIcon="mat:notifications"></mat-icon>
        <span class="alerta-egreso-count">{{ count }}</span>
      </button>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        overflow: visible;
        height: 100%;
      }
      .alerta-egreso-btn {
        position: relative;
        overflow: visible !important;
        color: #e65100;
      }
      .alerta-egreso-count {
        position: absolute;
        bottom: 4px;
        right: 4px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 8px;
        background: #d32f2f;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        line-height: 16px;
        text-align: center;
        pointer-events: none;
      }
      .alerta-egreso-btn.titila {
        animation: alerta-egreso-pulse 1.2s ease-in-out infinite;
      }
      @keyframes alerta-egreso-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.45;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .alerta-egreso-btn.titila {
          animation: none;
        }
      }
    `
  ]
})
export class ToolbarAlertaEgresoComponent implements OnInit, OnDestroy {
  count = 0;
  private sub?: Subscription;

  constructor(
    private alertas: AlertaEgresoSinVincularService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.alertas.startPolling();
    this.sub = this.alertas.items$.subscribe((items) => {
      this.count = items.length;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.alertas.stopPolling();
  }

  abrir(): void {
    abrirAlertaEgresoSinVincularDialog(this.dialog);
  }
}
