import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import {
  ConfirmacionPagoService,
  NotificacionSinAsignarDto
} from '../service/confirmacion-pago.service';

export interface AsociarNotificacionDialogData {
  montoEsperado: number;
  abonoCxcId?: number | null;
  historialReciboId?: number | null;
  /** Snapshot inicial (opcional); el dialog sigue escuchando en vivo. */
  notificaciones?: NotificacionSinAsignarDto[] | null;
}

const POLL_SIN_ASIGNAR_MS = 2500;

@Component({
  selector: 'app-asociar-notificacion-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Asociar pago bancario</h2>
    <mat-dialog-content>
      <p>
        Esperado:
        <strong>{{ data.montoEsperado | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong>
        @if (data.abonoCxcId) {
          · Abono CxC
        }
      </p>
      @if (!notificaciones.length) {
        <div class="empty">
          <mat-spinner diameter="22"></mat-spinner>
          <p>
            Esperando emails de pago sin asignar…
            <span class="hint">Se actualizará automáticamente.</span>
          </p>
        </div>
      } @else {
        <div class="cands">
          @for (n of notificaciones; track n.id) {
            <button
              type="button"
              mat-stroked-button
              class="cand"
              (click)="ref.close(n.id)">
              <span>
                {{ n.monto | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                @if (n.monto !== data.montoEsperado) {
                  <em class="diff">monto distinto</em>
                }
              </span>
              <span class="sub">{{ n.nombrePagador || 'Sin pagador' }}</span>
            </button>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close(null)">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .empty {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-top: 8px;
        opacity: 0.85;
      }
      .empty p {
        margin: 0;
        line-height: 1.35;
      }
      .hint {
        display: block;
        font-size: 12px;
        opacity: 0.7;
        margin-top: 4px;
      }
      .cands {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }
      .cand {
        justify-content: flex-start;
        text-align: left;
        height: auto;
        padding: 10px 14px;
        flex-direction: column;
        align-items: flex-start;
      }
      .sub {
        font-size: 12px;
        opacity: 0.7;
        font-weight: 400;
      }
      .diff {
        margin-left: 6px;
        font-size: 11px;
        font-style: normal;
        color: #c62828;
      }
    `
  ]
})
export class AsociarNotificacionDialogComponent implements OnInit, OnDestroy {
  notificaciones: NotificacionSinAsignarDto[] = [];
  private pollSub?: Subscription;

  constructor(
    public ref: MatDialogRef<AsociarNotificacionDialogComponent, number | null>,
    @Inject(MAT_DIALOG_DATA) public data: AsociarNotificacionDialogData,
    private confirmacionPago: ConfirmacionPagoService,
    private cdr: ChangeDetectorRef
  ) {
    this.notificaciones = [...(data.notificaciones ?? [])];
  }

  ngOnInit(): void {
    this.pollSub = interval(POLL_SIN_ASIGNAR_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.confirmacionPago.getSinAsignar().pipe(catchError(() => of(null)))
        )
      )
      .subscribe((list) => {
        if (list == null) {
          return;
        }
        this.notificaciones = list;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
