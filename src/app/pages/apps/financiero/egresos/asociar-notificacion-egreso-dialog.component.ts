import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import {
  GestionNotificacionesMediosService,
  NotificacionEmailPagoDto
} from '../../ventas/service/gestion-notificaciones-medios.service';

export interface AsociarNotificacionEgresoDialogData {
  egresoId: number;
  valor: number;
  fecha?: string | null;
}

const POLL_MS = 2500;

@Component({
  selector: 'app-asociar-notificacion-egreso-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title>Asociar notificación</h2>
    <mat-dialog-content>
      <p class="esperado">
        Egreso #{{ data.egresoId }} ·
        <strong>{{ data.valor | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong>
        @if (data.fecha) {
          · {{ data.fecha | date: 'dd/MM/yyyy' }}
        }
      </p>
      <p class="hint">
        Correos de egreso sin operación (p.ej. llegaron tarde). Al asociar se vincula
        el correo a este egreso. Si el dinero ya había pasado por Sin Clasificar, se
        anula ese paso (no se crea un ajuste).
      </p>
      @if (!notificaciones.length) {
        <div class="empty">
          <mat-spinner diameter="22"></mat-spinner>
          <p>
            Buscando notificaciones candidatas…
            <span class="subhint">Se actualiza automáticamente.</span>
          </p>
        </div>
      } @else {
        <div class="cands">
          @for (n of notificacionesOrdenadas; track n.id) {
            <button
              type="button"
              mat-stroked-button
              class="cand"
              [disabled]="asociando"
              (click)="seleccionar(n)">
              <span class="cand-main">
                {{ n.monto | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                @if (n.monto != null && n.monto !== data.valor) {
                  <em class="diff">monto distinto</em>
                }
              </span>
              <span class="sub">
                {{ n.nombrePagador || 'Sin pagador' }}
                · {{ n.recibidoEn | date: 'dd/MM/yyyy HH:mm' }}
                @if (n.plantillaNombre) {
                  · {{ n.plantillaNombre }}
                }
              </span>
            </button>
          }
        </div>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="asociando" (click)="ref.close(null)">
        Cancelar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .esperado {
        margin: 0 0 8px;
      }
      .hint {
        margin: 0 0 12px;
        font-size: 13px;
        opacity: 0.75;
      }
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
      .subhint {
        display: block;
        font-size: 12px;
        opacity: 0.7;
        margin-top: 4px;
      }
      .cands {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .cand {
        justify-content: flex-start;
        text-align: left;
        height: auto;
        padding: 10px 14px;
        flex-direction: column;
        align-items: flex-start;
      }
      .cand-main {
        font-weight: 600;
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
      .error {
        color: #c62828;
        font-size: 0.8rem;
        margin-top: 8px;
      }
    `
  ]
})
export class AsociarNotificacionEgresoDialogComponent implements OnInit, OnDestroy {
  notificaciones: NotificacionEmailPagoDto[] = [];
  asociando = false;
  error: string | null = null;
  private pollSub?: Subscription;

  constructor(
    public ref: MatDialogRef<AsociarNotificacionEgresoDialogComponent, NotificacionEmailPagoDto | null>,
    @Inject(MAT_DIALOG_DATA) public data: AsociarNotificacionEgresoDialogData,
    private api: GestionNotificacionesMediosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.pollSub = interval(POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.api.candidatasEgreso(this.data.egresoId).pipe(catchError(() => of(null)))
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

  get notificacionesOrdenadas(): NotificacionEmailPagoDto[] {
    return [...this.notificaciones].sort((a, b) => {
      const aEq = a.monto === this.data.valor ? 0 : 1;
      const bEq = b.monto === this.data.valor ? 0 : 1;
      if (aEq !== bEq) {
        return aEq - bEq;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }

  seleccionar(n: NotificacionEmailPagoDto): void {
    if (!n?.id || this.asociando) {
      return;
    }
    this.asociando = true;
    this.error = null;
    this.cdr.markForCheck();
    this.api.asociarEgreso(n.id, this.data.egresoId).subscribe({
      next: (updated: NotificacionEmailPagoDto) => {
        this.asociando = false;
        this.ref.close(updated);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.asociando = false;
        this.error =
          err?.error?.message || err?.message || 'No se pudo asociar la notificación.';
        this.cdr.markForCheck();
      }
    });
  }
}
