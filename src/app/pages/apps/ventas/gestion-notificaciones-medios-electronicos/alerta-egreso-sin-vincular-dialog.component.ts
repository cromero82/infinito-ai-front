import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AlertaEgresoSinVincularService } from '../service/alerta-egreso-sin-vincular.service';
import {
  AlertaEgresoSinVincularDto,
  EgresoCandidatoAlertaDto,
  GestionNotificacionesMediosService
} from '../service/gestion-notificaciones-medios.service';

export interface AlertaEgresoSinVincularDialogData {
  destinoOfId?: number | null;
}

@Component({
  selector: 'app-alerta-egreso-sin-vincular-dialog',
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
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Notificación de pago: QR y posible egreso no relacionado</h2>
    <mat-dialog-content>
      <p class="hint">
        El correo llegó y ya hay un egreso del mismo monto sin vincular. No se movió plata
        a Sin Clasificar. Puede ligar el correo al egreso o confirmar el paso por la bolsa.
      </p>
      @if (!items.length) {
        <p class="empty">No hay notificaciones por confirmar.</p>
      } @else {
        <div class="list">
          @for (a of items; track a.notificacion.id) {
            <article class="card">
              <div class="card-head">
                <strong>
                  {{
                    a.notificacion.monto != null
                      ? (a.notificacion.monto | currency: 'COP' : 'symbol-narrow' : '1.0-0')
                      : '—'
                  }}
                </strong>
                <span class="sub">
                  {{ a.notificacion.recibidoEn | date: 'dd/MM/yyyy HH:mm' }}
                  @if (a.notificacion.plantillaNombre) {
                    · {{ a.notificacion.plantillaNombre }}
                  }
                </span>
                @if (labelBeneficiarioSeleccionado(a); as beneficiario) {
                  <span class="sub">{{ beneficiario }}</span>
                }
              </div>
              <p class="cands-label">Egresos candidatos</p>
              <div class="cands">
                @for (c of a.candidatos; track c.id) {
                  <button
                    type="button"
                    mat-stroked-button
                    class="cand"
                    [class.selected]="seleccion(a.notificacion.id) === c.id"
                    [disabled]="busy"
                    (click)="seleccionar(a.notificacion.id, c)">
                    Egreso #{{ c.id }}
                    · {{ c.valor | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                    @if (c.fecha) {
                      · {{ c.fecha | date: 'dd/MM/yyyy' }}
                    }
                    @if (labelBeneficiario(c); as beneficiario) {
                      · {{ beneficiario }}
                    }
                    @if (c.descripcion) {
                      <span class="cand-desc">{{ c.descripcion }}</span>
                    }
                  </button>
                }
              </div>
              <div class="actions">
                <button
                  type="button"
                  mat-flat-button
                  color="primary"
                  [disabled]="busy || seleccion(a.notificacion.id) == null"
                  (click)="irAEgreso(a)">
                  Asociar y ver en egresos
                </button>
                <button
                  type="button"
                  mat-stroked-button
                  [disabled]="busy"
                  (click)="enviarABolsa(a)">
                  Enviar a Sin clasificar
                </button>
              </div>
            </article>
          }
        </div>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="busy" (click)="ref.close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        margin: 0 0 12px;
        font-size: 13px;
        opacity: 0.8;
        line-height: 1.4;
      }
      .empty {
        margin: 8px 0 0;
        opacity: 0.7;
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .card {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        padding: 12px;
      }
      .card-head {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 8px;
      }
      .sub {
        font-size: 12px;
        opacity: 0.7;
      }
      .cands-label {
        margin: 0 0 6px;
        font-size: 12px;
        font-weight: 600;
      }
      .cands {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cand {
        justify-content: flex-start;
        text-align: left;
        height: auto;
        padding: 8px 12px;
        flex-direction: column;
        align-items: flex-start;
      }
      .cand.selected {
        border-color: #1565c0;
        background: rgba(21, 101, 192, 0.08);
      }
      .cand-desc {
        display: block;
        font-size: 12px;
        opacity: 0.7;
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 420px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .error {
        color: #c62828;
        font-size: 0.8rem;
        margin-top: 8px;
      }
    `
  ]
})
export class AlertaEgresoSinVincularDialogComponent implements OnInit, OnDestroy {
  items: AlertaEgresoSinVincularDto[] = [];
  busy = false;
  error: string | null = null;
  private readonly seleccionado = new Map<number, number>();
  private sub?: Subscription;

  constructor(
    public ref: MatDialogRef<AlertaEgresoSinVincularDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertaEgresoSinVincularDialogData | null,
    private alertas: AlertaEgresoSinVincularService,
    private api: GestionNotificacionesMediosService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.alertas.items$.subscribe((all) => {
      const dest = this.data?.destinoOfId;
      this.items = dest != null ? all.filter((a) => a.origenFondosDestinoId === dest) : all;
      for (const a of this.items) {
        if (this.seleccionado.has(a.notificacion.id)) {
          continue;
        }
        if (a.candidatos.length === 1) {
          this.seleccionado.set(a.notificacion.id, a.candidatos[0].id);
        }
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  seleccion(notifId: number): number | undefined {
    return this.seleccionado.get(notifId);
  }

  seleccionar(notifId: number, c: EgresoCandidatoAlertaDto): void {
    this.seleccionado.set(notifId, c.id);
    this.cdr.markForCheck();
  }

  labelBeneficiario(c: EgresoCandidatoAlertaDto | null | undefined): string {
    if (!c) {
      return '';
    }
    const persona = (c.personaNombre || '').trim();
    if (persona) {
      return `Persona: ${persona}`;
    }
    const proveedor = (c.proveedorNombre || '').trim();
    if (proveedor) {
      return `Proveedor: ${proveedor}`;
    }
    return '';
  }

  labelBeneficiarioSeleccionado(a: AlertaEgresoSinVincularDto): string {
    const id = this.seleccion(a.notificacion.id);
    const c =
      (id != null ? a.candidatos.find((x) => x.id === id) : null) ||
      (a.candidatos.length === 1 ? a.candidatos[0] : null);
    return this.labelBeneficiario(c);
  }

  irAEgreso(a: AlertaEgresoSinVincularDto): void {
    const egresoId = this.seleccion(a.notificacion.id);
    if (!egresoId || this.busy) {
      return;
    }
    this.busy = true;
    this.error = null;
    this.cdr.markForCheck();
    this.api.asociarEgreso(a.notificacion.id, egresoId).subscribe({
      next: () => {
        this.alertas.refresh().subscribe({
          next: () => {
            this.busy = false;
            this.ref.close({ action: 'ir-egreso', egresoId });
            navegarAEgresoEnLista(this.router, egresoId);
          },
          error: () => {
            this.busy = false;
            this.ref.close({ action: 'ir-egreso', egresoId });
            navegarAEgresoEnLista(this.router, egresoId);
          }
        });
      },
      error: (err: { error?: { error?: string; message?: string }; message?: string }) => {
        this.busy = false;
        this.error =
          err?.error?.error ||
          err?.error?.message ||
          err?.message ||
          'No se pudo asociar la notificación.';
        this.cdr.markForCheck();
      }
    });
  }

  enviarABolsa(a: AlertaEgresoSinVincularDto): void {
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.error = null;
    this.cdr.markForCheck();
    this.api.enviarABolsa(a.notificacion.id).subscribe({
      next: () => {
        this.snackBar.open(
          'El movimiento quedó en Sin clasificar. El egreso no se vinculó.',
          'Cerrar',
          { duration: 3500 }
        );
        this.alertas.refresh().subscribe({
          next: (items) => {
            this.busy = false;
            const dest = this.data?.destinoOfId;
            const rest =
              dest != null ? items.filter((x) => x.origenFondosDestinoId === dest) : items;
            if (!rest.length) {
              this.ref.close({ action: 'enviar-bolsa' });
            }
            this.cdr.markForCheck();
          },
          error: () => {
            this.busy = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err: { error?: { error?: string; message?: string }; message?: string }) => {
        this.busy = false;
        this.error =
          err?.error?.error ||
          err?.error?.message ||
          err?.message ||
          'No se pudo enviar a Sin clasificar.';
        this.cdr.markForCheck();
      }
    });
  }
}

export function navegarAEgresoEnLista(router: Router, egresoId: number): void {
  void router.navigate(['/apps/financiero/egresos'], {
    queryParams: { egresoId, _r: Date.now() }
  });
}

export function abrirAlertaEgresoSinVincularDialog(
  dialog: MatDialog,
  destinoOfId?: number | null
): MatDialogRef<AlertaEgresoSinVincularDialogComponent> {
  return dialog.open(AlertaEgresoSinVincularDialogComponent, {
    width: '560px',
    maxWidth: '95vw',
    data: { destinoOfId: destinoOfId ?? null }
  });
}
