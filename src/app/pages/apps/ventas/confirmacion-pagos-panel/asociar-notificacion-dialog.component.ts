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
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import {
  ConfirmacionPagoService,
  NotificacionSinAsignarDto
} from '../service/confirmacion-pago.service';
import { MetodoPagoDto, MetodoPagoService } from '../service/metodo-pago.service';

export interface AsociarNotificacionDialogData {
  montoEsperado: number;
  /** Id HRE del pendiente del panel. */
  historialElectronicoId: number;
  abonoCxcId?: number | null;
  historialReciboId?: number | null;
  /** Medio de la venta/abono pendiente (panel). */
  metodoPagoId?: number | null;
  /** Snapshot inicial (opcional); el dialog sigue escuchando en vivo. */
  notificaciones?: NotificacionSinAsignarDto[] | null;
}

export interface AsociarNotificacionDialogResult {
  notificacionId?: number | null;
  metodoPagoCorregido?: number | null;
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
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Asociar pago bancario</h2>
    <mat-dialog-content>
      <div class="esperado-block">
        <div class="esperado-row">
          <p class="esperado-text">
            @if (mostrarIconosMetodo && iconoEsperado; as ico) {
              <img
                class="mp-icon"
                [src]="ico"
                alt=""
                width="20"
                height="20"
                [matTooltip]="labelMetodo(data.metodoPagoId)" />
            }
            Esperado:
            <strong>{{ data.montoEsperado | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong>
            @if (data.abonoCxcId) {
              · Abono CxC
            }
          </p>
          @if (mostrarCorregirMedio) {
            <div class="corregir-mp-wrap">
              @if (!menuCorregirVisible) {
                <button
                  type="button"
                  mat-icon-button
                  class="corregir-mp-trigger"
                  matTooltip="Corregir / cambiar medio"
                  aria-label="Corregir / cambiar medio"
                  [disabled]="corrigiendo || metodosCorreccion.length === 0"
                  (click)="abrirMenuCorregir()">
                  <mat-icon svgIcon="mat:build"></mat-icon>
                </button>
              } @else {
                <div class="corregir-mp" [class.corregir-mp--busy]="corrigiendo">
                  <button
                    type="button"
                    class="corregir-mp__label"
                    mat-stroked-button
                    [matMenuTriggerFor]="mpMenu"
                    [disabled]="corrigiendo || metodosCorreccion.length === 0"
                    matTooltip="El cajero pudo elegir el medio electrónico incorrecto">
                    Corregir / cambiar medio
                  </button>
                  <button
                    type="button"
                    class="corregir-mp__chevron"
                    mat-stroked-button
                    [matMenuTriggerFor]="mpMenu"
                    [disabled]="corrigiendo || metodosCorreccion.length === 0"
                    aria-label="Elegir otro método de pago">
                    <mat-icon svgIcon="mat:arrow_drop_down"></mat-icon>
                  </button>
                  <mat-menu #mpMenu="matMenu" xPosition="before" yPosition="below">
                    @for (m of metodosCorreccion; track m.id) {
                      <button
                        type="button"
                        mat-menu-item
                        [disabled]="m.id === data.metodoPagoId || corrigiendo"
                        (click)="corregirMedio(m)">
                        @if (m.file) {
                          <img
                            class="mp-icon mp-icon--menu"
                            [src]="iconoUrl(m.file)"
                            alt=""
                            width="22"
                            height="22" />
                        }
                        <span>{{ m.descripcion }}</span>
                      </button>
                    }
                  </mat-menu>
                </div>
              }
            </div>
          }
        </div>
      </div>
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
          @for (n of notificacionesOrdenadas; track n.id) {
            <button
              type="button"
              mat-stroked-button
              class="cand"
              [class.cand--otro-medio]="!aplicaAlPendiente(n)"
              [disabled]="!aplicaAlPendiente(n)"
              [matTooltip]="tooltipCand(n)"
              (click)="seleccionar(n)">
              <span class="cand-main">
                @if (mostrarIconosMetodo && iconoNotif(n); as icoN) {
                  <img class="mp-icon" [src]="icoN" alt="" width="20" height="20" />
                }
                <span>
                  {{ n.monto | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                  @if (n.monto !== data.montoEsperado) {
                    <em class="diff">monto distinto</em>
                  }
                  @if (!aplicaAlPendiente(n)) {
                    <em class="otro">otro medio</em>
                  }
                </span>
              </span>
              <span class="sub">{{ n.nombrePagador || 'Sin pagador' }}</span>
            </button>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cerrar()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .esperado-block {
        margin-bottom: 8px;
      }
      .esperado-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 0 0 8px;
        min-height: 40px;
      }
      .esperado-text {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin: 0;
        min-width: 0;
        flex: 1 1 auto;
      }
      .corregir-mp-wrap {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-shrink: 0;
        margin: 0;
        min-height: 0;
      }
      .corregir-mp-trigger {
        width: 36px;
        height: 36px;
        padding: 0;
        color: #5a6a7e;
      }
      .corregir-mp {
        display: inline-flex;
        align-items: stretch;
        border-radius: 4px;
        overflow: hidden;
      }
      .corregir-mp__label {
        border-top-right-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
        border-right: 0 !important;
        min-height: 36px;
        font-size: 13px;
        padding: 0 12px;
      }
      .corregir-mp__chevron {
        border-top-left-radius: 0 !important;
        border-bottom-left-radius: 0 !important;
        min-width: 36px !important;
        width: 36px;
        padding: 0 !important;
        min-height: 36px;
      }
      .corregir-mp__chevron .mat-icon {
        margin: 0;
      }
      .corregir-mp--busy {
        opacity: 0.7;
        pointer-events: none;
      }
      .mp-icon {
        object-fit: contain;
        flex-shrink: 0;
        vertical-align: middle;
      }
      .mp-icon--menu {
        margin-right: 8px;
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
      .cand--otro-medio {
        opacity: 0.82;
        border-style: dashed !important;
        background: rgba(109, 76, 65, 0.06);
      }
      .cand-main {
        display: inline-flex;
        align-items: center;
        gap: 8px;
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
      .otro {
        margin-left: 6px;
        font-size: 11px;
        font-style: normal;
        color: #6d4c41;
      }
    `
  ]
})
export class AsociarNotificacionDialogComponent implements OnInit, OnDestroy {
  notificaciones: NotificacionSinAsignarDto[] = [];
  metodosCorreccion: MetodoPagoDto[] = [];
  corrigiendo = false;
  /** Tras clic en icono build: muestra el control «Corregir / cambiar medio». */
  menuCorregirVisible = false;
  private metodoCorregido: number | null = null;
  private metodosPorId = new Map<number, MetodoPagoDto>();
  private pollSub?: Subscription;

  constructor(
    public ref: MatDialogRef<
      AsociarNotificacionDialogComponent,
      AsociarNotificacionDialogResult | number | null
    >,
    @Inject(MAT_DIALOG_DATA) public data: AsociarNotificacionDialogData,
    private confirmacionPago: ConfirmacionPagoService,
    private metodoPagoService: MetodoPagoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.notificaciones = [...(data.notificaciones ?? [])];
  }

  ngOnInit(): void {
    this.metodoPagoService.obtenerMetodosPago().subscribe({
      next: (list) => {
        this.metodosPorId = new Map((list || []).map((m) => [m.id, m]));
        this.metodosCorreccion = (list || []).filter(
          (m) =>
            !!m.permiteNotificacion &&
            (m.estado || 'ACTIVO').toUpperCase() !== 'INACTIVO'
        );
        this.cdr.markForCheck();
      }
    });
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

  /**
   * Iconos solo si hay mezcla de medios entre notificaciones
   * o alguna difiere del pendiente del ticket.
   */
  get mostrarIconosMetodo(): boolean {
    if (!this.notificaciones.length) {
      return false;
    }
    const ids = new Set<number | null | undefined>();
    for (const n of this.notificaciones) {
      ids.add(n.metodoPagoId ?? null);
    }
    if (ids.size > 1) {
      return true;
    }
    const unico = this.notificaciones[0]?.metodoPagoId ?? null;
    const esperado = this.data.metodoPagoId ?? null;
    return esperado != null && unico != null && esperado !== unico;
  }

  /** Botón corregir cuando hay al menos una notif de otro medio. */
  get mostrarCorregirMedio(): boolean {
    if (this.data.historialElectronicoId == null) {
      return false;
    }
    return this.notificaciones.some((n) => !this.aplicaAlPendiente(n));
  }

  abrirMenuCorregir(): void {
    if (this.corrigiendo || this.metodosCorreccion.length === 0) {
      return;
    }
    this.menuCorregirVisible = true;
    this.cdr.markForCheck();
  }

  get iconoEsperado(): string {
    return this.iconoSrc(this.data.metodoPagoId);
  }

  get notificacionesOrdenadas(): NotificacionSinAsignarDto[] {
    return [...this.notificaciones].sort((a, b) => {
      const aOk = this.aplicaAlPendiente(a) ? 0 : 1;
      const bOk = this.aplicaAlPendiente(b) ? 0 : 1;
      if (aOk !== bOk) {
        return aOk - bOk;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }

  aplicaAlPendiente(n: NotificacionSinAsignarDto): boolean {
    const esperado = this.data.metodoPagoId;
    if (esperado == null) {
      return true;
    }
    if (n.metodoPagoId == null) {
      return true;
    }
    return n.metodoPagoId === esperado;
  }

  iconoNotif(n: NotificacionSinAsignarDto): string {
    return this.iconoSrc(n.metodoPagoId);
  }

  iconoUrl(file?: string | null): string {
    return this.metodoPagoService.iconoUrl(file);
  }

  labelMetodo(id?: number | null): string {
    if (id == null) {
      return 'Sin método';
    }
    return this.metodosPorId.get(id)?.descripcion || `Método #${id}`;
  }

  tooltipCand(n: NotificacionSinAsignarDto): string {
    if (this.aplicaAlPendiente(n)) {
      return '';
    }
    return `No aplica: otro método de pago (${this.labelMetodo(n.metodoPagoId)}). Usa «Corregir / cambiar medio» si el cajero eligió mal.`;
  }

  corregirMedio(m: MetodoPagoDto): void {
    if (!m?.id || m.id === this.data.metodoPagoId || this.corrigiendo) {
      return;
    }
    this.corrigiendo = true;
    this.cdr.markForCheck();
    this.confirmacionPago.corregirMetodoPago(this.data.historialElectronicoId, m.id).subscribe({
      next: () => {
        this.data.metodoPagoId = m.id;
        this.metodoCorregido = m.id;
        this.corrigiendo = false;
        this.snackBar.open(`Medio corregido a «${m.descripcion}»`, 'Cerrar', {
          duration: 3200,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.corrigiendo = false;
        this.snackBar.open(
          err?.error?.message || err?.message || 'No se pudo corregir el medio de pago',
          'Cerrar',
          { duration: 4500, panelClass: ['error-snackbar'] }
        );
        this.cdr.markForCheck();
      }
    });
  }

  seleccionar(n: NotificacionSinAsignarDto): void {
    if (!this.aplicaAlPendiente(n)) {
      return;
    }
    this.ref.close({
      notificacionId: n.id,
      metodoPagoCorregido: this.metodoCorregido
    });
  }

  cerrar(): void {
    if (this.metodoCorregido != null) {
      this.ref.close({ notificacionId: null, metodoPagoCorregido: this.metodoCorregido });
      return;
    }
    this.ref.close(null);
  }

  private iconoSrc(metodoPagoId?: number | null): string {
    if (metodoPagoId == null) {
      return '';
    }
    const file = this.metodosPorId.get(metodoPagoId)?.file;
    return this.metodoPagoService.iconoUrl(file);
  }
}
