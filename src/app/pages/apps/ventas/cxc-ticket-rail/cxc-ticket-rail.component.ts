import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AbonoCxcDto,
  CuentaPorCobrarDto,
  CuentaPorCobrarService
} from '../service/cuenta-por-cobrar.service';
import { FechaUtilService } from '../service/fecha-util.service';

/** Defaults alertas.creditos.tiempoRiesgos (días). */
const RIESGO = { normal: 5, medio: 15, alto: 35 };
const MESES_CORTO = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic'
] as const;

@Component({
  selector: 'vex-cxc-ticket-rail',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <aside
      class="cxc-rail"
      [class.cxc-rail--collapsed]="!expanded"
      [attr.data-riesgo]="riesgo">
      <button
        type="button"
        class="cxc-rail-toggle"
        [matTooltip]="expanded ? 'Ocultar crédito' : 'Ver crédito'"
        (click)="toggle.emit()">
        <span class="cxc-rail-dot" [attr.data-riesgo]="riesgo"></span>
        <mat-icon
          [svgIcon]="expanded ? 'mat:chevron_right' : 'mat:chevron_left'"></mat-icon>
      </button>

      @if (expanded && cuenta) {
        <div class="cxc-rail-body">
          <header class="cxc-rail-header">
            <div class="title">Crédito</div>
            <div class="cliente">{{ cuenta.clienteNombre || 'Cliente' }}</div>
            <div class="meta">
              Inicio: {{ formatFecha(cuenta.fechaOrigen) }}
              {{ riesgoLabel }}
            </div>
          </header>

          <div class="cxc-rail-saldos">
            <div class="row">
              <span>Total ticket</span>
              <span>{{
                formatMoney(cuenta.totalTicket ?? cuenta.montoOriginal)
              }}</span>
            </div>
            <div class="row">
              <span>Original crédito</span>
              <span>{{ formatMoney(cuenta.montoOriginal) }}</span>
            </div>
            <div class="row">
              <span>Abonado</span>
              <span>{{ formatMoney(abonado) }}</span>
            </div>
            <div class="row saldo">
              <span>Saldo</span>
              <strong>{{ formatMoney(cuenta.saldoPendiente) }}</strong>
            </div>
          </div>

          <div class="cxc-rail-abonos">
            <div class="abonos-title">Abonos</div>
            @if (loadingAbonos) {
              <div class="loading">
                <mat-spinner diameter="20"></mat-spinner>
              </div>
            } @else if (abonos.length === 0) {
              <div class="empty">Sin abonos aún</div>
            } @else {
              <ul class="abonos-list">
                @for (a of abonos; track a.id) {
                  <li>
                    <span class="f">{{ formatFecha(a.fechaAbono) }}</span>
                    <span class="m">
                      {{ a.metodoPagoDescripcion || '—' }}
                      @if (a.clientePagadorNombre) {
                        <span class="pagador"
                          >· {{ a.clientePagadorNombre }}</span
                        >
                      }
                    </span>
                    <span class="v">{{ formatMoney(a.monto) }}</span>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="cxc-rail-actions">
            <button
              mat-stroked-button
              type="button"
              class="cxc-rail-cta"
              (click)="imprimir.emit()">
              <mat-icon svgIcon="mat:print"></mat-icon>
              Imprimir
            </button>
            @if (cuenta.estado === 'ABIERTA' || cuenta.estado === 'PARCIAL') {
              <button
                mat-flat-button
                color="primary"
                type="button"
                class="cxc-rail-cta cxc-rail-cta--abonar"
                (click)="abonar.emit()">
                Registrar abono
              </button>
              <button
                mat-stroked-button
                type="button"
                class="cxc-rail-cta"
                matTooltip="Anular, castigar u otras gestiones en Financiero"
                (click)="otrasAcciones.emit()">
                <mat-icon svgIcon="mat:more_horiz"></mat-icon>
                Otras acciones
              </button>
            }
          </div>
        </div>
      }
    </aside>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 0 0 auto;
        align-self: stretch;
        min-height: 0;
      }
      .cxc-rail {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        background: rgba(0, 0, 0, 0.02);
        border-left: 1px solid rgba(0, 0, 0, 0.08);
        min-height: 0;
        height: 100%;
      }
      .cxc-rail--collapsed {
        width: 28px;
      }
      .cxc-rail-toggle {
        flex: 0 0 28px;
        width: 28px;
        border: 0;
        background: transparent;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        padding: 10px 0;
        color: rgba(0, 0, 0, 0.55);
      }
      .cxc-rail-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #43a047;
      }
      .cxc-rail-dot[data-riesgo='medio'] {
        background: #fb8c00;
      }
      .cxc-rail-dot[data-riesgo='alto'] {
        background: #e53935;
      }
      .cxc-rail-body {
        width: 320px;
        padding: 12px 14px 14px 6px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 0;
        overflow: auto;
      }
      .cxc-rail-header .title {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(0, 0, 0, 0.5);
      }
      .cxc-rail-header .cliente {
        font-weight: 600;
        font-size: 1rem;
      }
      .cxc-rail-header .meta {
        font-size: 0.8rem;
        color: rgba(0, 0, 0, 0.5);
      }
      .cxc-rail-saldos {
        font-size: 0.9rem;
        background: var(--vex-background-card, #fff);
        border-radius: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(0, 0, 0, 0.06);
      }
      .cxc-rail-saldos .row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        line-height: 1.5;
      }
      .cxc-rail-saldos .saldo {
        margin-top: 8px;
        margin-left: -6px;
        margin-right: -6px;
        padding: 8px 10px;
        border-top: none;
        border-radius: 6px;
        background: rgba(46, 125, 50, 0.08);
        border: 1px solid rgba(46, 125, 50, 0.18);
        font-size: 1rem;
        align-items: center;
      }
      .cxc-rail-saldos .saldo span {
        font-weight: 600;
        color: rgba(27, 94, 32, 0.9);
      }
      .cxc-rail-saldos .saldo strong {
        font-size: 1.12rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: rgba(27, 94, 32, 0.95);
      }
      .cxc-rail-abonos {
        flex: 1 1 auto;
        min-height: 0;
      }
      .abonos-title {
        font-size: 0.82rem;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .abonos-list {
        list-style: none;
        margin: 0;
        padding: 0;
        font-size: 0.82rem;
      }
      .abonos-list li {
        display: grid;
        grid-template-columns: 56px 1fr auto;
        gap: 4px;
        padding: 5px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      }
      .abonos-list .f {
        color: rgba(0, 0, 0, 0.5);
      }
      .abonos-list .m {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .abonos-list .pagador {
        font-weight: 600;
      }
      .abonos-list .v {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
      }
      .empty,
      .loading {
        font-size: 0.82rem;
        color: rgba(0, 0, 0, 0.45);
        padding: 8px 0;
      }
      .cxc-rail-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        max-width: 260px;
        padding-right: 4px;
        margin-bottom: 8px;
      }
      .cxc-rail-cta {
        width: 100%;
      }
      .cxc-rail-cta mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
        margin-right: 4px;
        vertical-align: middle;
      }

      :host-context(.dark) .cxc-rail {
        background: rgba(255, 255, 255, 0.03);
        border-left-color: rgba(255, 255, 255, 0.1);
      }
      :host-context(.dark) .cxc-rail-toggle {
        color: rgba(255, 255, 255, 0.55);
      }
      :host-context(.dark) .cxc-rail-header .title,
      :host-context(.dark) .cxc-rail-header .meta {
        color: rgba(255, 255, 255, 0.5);
      }
      :host-context(.dark) .cxc-rail-saldos {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
      }
      :host-context(.dark) .cxc-rail-saldos .saldo {
        background: rgba(129, 199, 132, 0.12);
        border-color: rgba(129, 199, 132, 0.28);
      }
      :host-context(.dark) .cxc-rail-saldos .saldo span,
      :host-context(.dark) .cxc-rail-saldos .saldo strong {
        color: rgba(200, 230, 201, 0.95);
      }
      :host-context(.dark) .abonos-list li {
        border-bottom-color: rgba(255, 255, 255, 0.08);
      }
      :host-context(.dark) .abonos-list .f,
      :host-context(.dark) .empty,
      :host-context(.dark) .loading {
        color: rgba(255, 255, 255, 0.5);
      }
    `
  ]
})
export class CxcTicketRailComponent implements OnChanges {
  @Input() cuenta: CuentaPorCobrarDto | null = null;
  @Input() expanded = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() abonar = new EventEmitter<void>();
  @Output() imprimir = new EventEmitter<void>();
  @Output() otrasAcciones = new EventEmitter<void>();

  abonos: AbonoCxcDto[] = [];
  loadingAbonos = false;

  private readonly moneyFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  constructor(
    private cxcService: CuentaPorCobrarService,
    private fechaUtil: FechaUtilService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['cuenta'] || changes['expanded']) &&
      this.expanded &&
      this.cuenta
    ) {
      this.loadAbonos();
    }
    if (changes['cuenta'] && !this.cuenta) {
      this.abonos = [];
    }
  }

  get abonado(): number {
    if (!this.cuenta) {
      return 0;
    }
    return Math.max(
      0,
      (Number(this.cuenta.montoOriginal) || 0) -
        (Number(this.cuenta.saldoPendiente) || 0)
    );
  }

  get riesgo(): 'normal' | 'medio' | 'alto' {
    if (!this.cuenta) {
      return 'normal';
    }
    const dias = this.diasDesdeOrigen(this.cuenta);
    if (dias >= RIESGO.alto) {
      return 'alto';
    }
    if (dias >= RIESGO.medio) {
      return 'medio';
    }
    return 'normal';
  }

  get riesgoLabel(): string {
    const mapa = { normal: 'Normal', medio: 'Medio', alto: 'Alto' } as const;
    const dias = this.cuenta ? this.diasDesdeOrigen(this.cuenta) : 0;
    const unidad = dias === 1 ? 'dia' : 'dias';
    return `${mapa[this.riesgo]} (${dias} ${unidad})`;
  }

  formatMoney(n: number | null | undefined): string {
    return this.moneyFmt.format(Math.round(Number(n) || 0));
  }

  /** Formato corto: 19/ago */
  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return '—';
    }
    try {
      const d = this.fechaUtil.parseDateAsLocal(fecha);
      if (isNaN(d.getTime())) {
        return fecha;
      }
      return `${d.getDate()}/${MESES_CORTO[d.getMonth()]}`;
    } catch {
      return fecha;
    }
  }

  private diasDesdeOrigen(cuenta: CuentaPorCobrarDto): number {
    if (!cuenta.fechaOrigen) {
      return 0;
    }
    const origen = new Date(cuenta.fechaOrigen).getTime();
    if (Number.isNaN(origen)) {
      return 0;
    }
    return Math.max(0, Math.floor((Date.now() - origen) / 86400000));
  }

  private loadAbonos(): void {
    if (!this.cuenta) {
      return;
    }
    this.loadingAbonos = true;
    this.cxcService.listarAbonos(this.cuenta.id).subscribe({
      next: (rows) => {
        this.abonos = rows ?? [];
        this.loadingAbonos = false;
      },
      error: () => {
        this.abonos = [];
        this.loadingAbonos = false;
      }
    });
  }

  /** Recarga historial (tras abonar). */
  refreshAbonos(): void {
    if (this.expanded && this.cuenta) {
      this.loadAbonos();
    }
  }
}
