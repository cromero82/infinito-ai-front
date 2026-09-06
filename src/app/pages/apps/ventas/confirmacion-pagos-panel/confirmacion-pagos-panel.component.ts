import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription, interval, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  ConfirmacionPagoService,
  MontoDistintoConfirmacionDto,
  PendienteConfirmacionDto
} from '../service/confirmacion-pago.service';
import { MetodoPagoDto, MetodoPagoService } from '../service/metodo-pago.service';
import { AmbiguidadPagoDialogComponent } from './ambiguidad-pago-dialog.component';
import { AsociarNotificacionDialogComponent, AsociarNotificacionDialogResult } from './asociar-notificacion-dialog.component';
import { MontoDistintoPagoDialogComponent, MontoDistintoDialogResult } from './monto-distinto-pago-dialog.component';
import { TicketSinNotifProductosDialogComponent } from '../gestion-notificaciones-medios-electronicos/ticket-sin-notif-productos-dialog.component';
import { FechaUtilService } from '../service/fecha-util.service';
import { ConfigurationService } from '../../../../auth/service/configuration.service';

const POLL_MS = 2500;
const COUNTDOWN_FROM = 3;
const POS_STORAGE_KEY = 'confirmacion-pagos-panel-pos';
const MINIMIZED_STORAGE_KEY = 'confirmacion-pagos-panel-minimized';
const PANEL_W = 420;
const PANEL_H_MIN = 120;
const ANIM_MS = 220;
const DOCK_W = 300;
const DOCK_H = 32;

@Component({
  selector: 'app-confirmacion-pagos-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule],
  templateUrl: './confirmacion-pagos-panel.component.html',
  styleUrls: ['./confirmacion-pagos-panel.component.scss']
})
export class ConfirmacionPagosPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() sesionId: number | null = null;
  /** Tras faltante QR → ticket reabierto; el padre abre modal Generar crédito. */
  @Output() creditoDesdeFaltante = new EventEmitter<PendienteConfirmacionDto>();

  items: PendienteConfirmacionDto[] = [];
  countdowns = new Map<number, number>();
  private metodosPorId = new Map<number, MetodoPagoDto>();

  @ViewChild('panelEl') panelEl?: ElementRef<HTMLElement>;
  @ViewChild('dockEl') dockEl?: ElementRef<HTMLElement>;

  panelLeft: number | null = null;
  panelTop: number | null = null;
  dragging = false;
  minimizado = false;
  animando: 'min' | 'restore' | null = null;
  animTransform: string | null = null;
  private animTimer: ReturnType<typeof setTimeout> | null = null;

  private pollSub?: Subscription;
  private tickSub?: Subscription;
  private ambiguityOpen = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private pollingStarted = false;

  constructor(
    private confirmacionPago: ConfirmacionPagoService,
    private metodoPagoService: MetodoPagoService,
    private configurationService: ConfigurationService,
    private dialog: MatDialog,
    private fechaUtil: FechaUtilService,
    private cdr: ChangeDetectorRef
  ) {
    this.restorePosition();
    this.restoreMinimized();
  }

  ngOnInit(): void {
    if (!this.configurationService.isNotificacionesActivas()) {
      this.stopPolling();
      this.items = [];
      return;
    }
    this.metodoPagoService.obtenerMetodosPago().subscribe({
      next: (list) => {
        this.metodosPorId = new Map((list || []).map((m) => [m.id, m]));
        this.cdr.markForCheck();
      }
    });
    this.revisarPendientes();
  }

  iconoMetodo(item: PendienteConfirmacionDto): string {
    const file = item.metodoPagoId != null
      ? this.metodosPorId.get(item.metodoPagoId)?.file
      : null;
    const src = this.metodoPagoService.iconoUrl(file || 'qr-bancolombia.png');
    return src.startsWith('/') ? src : `/${src}`;
  }

  /** Franja izquierda en espera = color del medio (como OF). Otros estados usan CSS de estado. */
  colorFranjaEspera(item: PendienteConfirmacionDto): string | null {
    if (item.estado !== 'CREADA') {
      return null;
    }
    if (item.metodoPagoId == null) {
      return null;
    }
    return this.metodosPorId.get(item.metodoPagoId)?.color?.trim() || null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sesionId']) {
      this.stopPolling();
      this.items = [];
      this.countdowns.clear();
      if (!changes['sesionId'].firstChange) {
        this.revisarPendientes();
      }
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.clearAnimTimer();
    this.stopPolling();
  }

  get visible(): boolean {
    return this.configurationService.isNotificacionesActivas() && this.items.length > 0;
  }

  get muestraDock(): boolean {
    return this.visible && (this.minimizado || this.animando != null);
  }

  get pendientesCierre(): number {
    return this.items.length;
  }

  get pendientesCierreLabel(): string {
    const n = this.pendientesCierre;
    return n === 1 ? 'pendiente' : 'pendientes';
  }

  get panelStyle(): Record<string, string> | null {
    const style: Record<string, string> = {};
    if (this.panelLeft != null && this.panelTop != null) {
      style['left'] = `${this.panelLeft}px`;
      style['top'] = `${this.panelTop}px`;
      style['right'] = 'auto';
      style['bottom'] = 'auto';
    }
    if (this.animTransform) {
      style['transform'] = this.animTransform;
      style['transform-origin'] = 'top left';
    }
    return Object.keys(style).length ? style : null;
  }

  trackById(_: number, item: PendienteConfirmacionDto): number {
    return item.id;
  }

  minimizar(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.animando || this.minimizado) {
      return;
    }
    const from = this.panelEl?.nativeElement.getBoundingClientRect();
    this.animando = 'min';
    this.cdr.detectChanges();
    const to = this.dockTargetRect();
    if (!from) {
      this.minimizado = true;
      this.persistMinimized();
      this.finishAnim();
      return;
    }
    this.playWindowAnim(from, to, 'min');
  }

  restaurar(): void {
    if (this.animando || !this.minimizado) {
      return;
    }
    const panelRect = this.panelEl?.nativeElement.getBoundingClientRect();
    const dockRect = this.dockTargetRect();
    this.animando = 'restore';
    this.minimizado = false;
    if (!panelRect) {
      this.persistMinimized();
      this.finishAnim();
      return;
    }
    this.animTransform = this.shrinkTransform(panelRect, dockRect);
    this.cdr.detectChanges();
    this.playWindowAnim(panelRect, dockRect, 'restore');
  }

  onDragStart(event: PointerEvent): void {
    if (event.button !== 0 || this.animando || this.minimizado) {
      return;
    }
    const target = event.currentTarget as HTMLElement | null;
    const panel = target?.closest('.confirmacion-pagos-panel') as HTMLElement | null;
    if (!panel) {
      return;
    }
    const rect = panel.getBoundingClientRect();
    this.panelLeft = rect.left;
    this.panelTop = rect.top;
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    this.dragging = true;
    try {
      (event.target as Element)?.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
    event.preventDefault();
    this.cdr.markForCheck();
  }

  /** Doble clic en el header: vuelve a la esquina por defecto. */
  resetPosition(): void {
    this.panelLeft = null;
    this.panelTop = null;
    try {
      localStorage.removeItem(POS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    this.cdr.markForCheck();
  }

  @HostListener('document:pointermove', ['$event'])
  onDragMove(event: PointerEvent): void {
    if (!this.dragging || this.panelLeft == null || this.panelTop == null) {
      return;
    }
    this.panelLeft = this.clampLeft(event.clientX - this.dragOffsetX);
    this.panelTop = this.clampTop(event.clientY - this.dragOffsetY);
    this.cdr.markForCheck();
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  onDragEnd(): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.persistPosition();
    this.cdr.markForCheck();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.panelLeft == null || this.panelTop == null) {
      return;
    }
    this.panelLeft = this.clampLeft(this.panelLeft);
    this.panelTop = this.clampTop(this.panelTop);
    this.persistPosition();
    this.cdr.markForCheck();
  }

  private clampLeft(left: number): number {
    const maxLeft = Math.max(0, window.innerWidth - PANEL_W);
    return Math.min(maxLeft, Math.max(0, left));
  }

  private clampTop(top: number): number {
    const maxTop = Math.max(0, window.innerHeight - PANEL_H_MIN);
    return Math.min(maxTop, Math.max(0, top));
  }

  private restorePosition(): void {
    try {
      const raw = localStorage.getItem(POS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { left?: number; top?: number };
      if (typeof parsed.left !== 'number' || typeof parsed.top !== 'number') {
        return;
      }
      if (
        parsed.left > window.innerWidth - 40 ||
        parsed.top > window.innerHeight - 40 ||
        parsed.left < -20 ||
        parsed.top < -20
      ) {
        localStorage.removeItem(POS_STORAGE_KEY);
        return;
      }
      this.panelLeft = this.clampLeft(parsed.left);
      this.panelTop = this.clampTop(parsed.top);
    } catch {
      /* ignore */
    }
  }

  private persistPosition(): void {
    if (this.panelLeft == null || this.panelTop == null) {
      return;
    }
    try {
      localStorage.setItem(
        POS_STORAGE_KEY,
        JSON.stringify({ left: this.panelLeft, top: this.panelTop })
      );
    } catch {
      /* ignore */
    }
  }

  private restoreMinimized(): void {
    try {
      this.minimizado = localStorage.getItem(MINIMIZED_STORAGE_KEY) === '1';
    } catch {
      this.minimizado = false;
    }
  }

  private persistMinimized(): void {
    try {
      localStorage.setItem(MINIMIZED_STORAGE_KEY, this.minimizado ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  private dockTargetRect(): DOMRect {
    const el = this.dockEl?.nativeElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return rect;
      }
    }
    return new DOMRect(
      48,
      Math.max(0, window.innerHeight - 4 - DOCK_H),
      DOCK_W,
      DOCK_H
    );
  }

  private shrinkTransform(panel: DOMRect, dock: DOMRect): string {
    const sx = Math.max(0.06, dock.width / Math.max(1, panel.width));
    const sy = Math.max(0.06, dock.height / Math.max(1, panel.height));
    return `translate(${dock.left - panel.left}px, ${dock.top - panel.top}px) scale(${sx}, ${sy})`;
  }

  private playWindowAnim(
    panel: DOMRect,
    dock: DOMRect,
    kind: 'min' | 'restore'
  ): void {
    const shrink = this.shrinkTransform(panel, dock);
    const full = 'translate(0px, 0px) scale(1, 1)';
    this.animTransform = kind === 'min' ? full : shrink;
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.animTransform = kind === 'min' ? shrink : full;
        this.cdr.markForCheck();
      });
    });
    this.clearAnimTimer();
    this.animTimer = setTimeout(() => this.finishAnim(), ANIM_MS);
  }

  private finishAnim(): void {
    this.clearAnimTimer();
    if (this.animando === 'min') {
      this.minimizado = true;
    } else if (this.animando === 'restore') {
      this.minimizado = false;
    }
    this.persistMinimized();
    this.animando = null;
    this.animTransform = null;
    this.cdr.markForCheck();
  }

  private clearAnimTimer(): void {
    if (this.animTimer != null) {
      clearTimeout(this.animTimer);
      this.animTimer = null;
    }
  }

  /** Una consulta; si hay pendientes arranca el poll, si no, no vuelve a preguntar. */
  revisarPendientes(): void {
    if (!this.configurationService.isNotificacionesActivas()) {
      this.stopPolling();
      this.items = [];
      this.cdr.markForCheck();
      return;
    }
    if (this.sesionId == null) {
      this.stopPolling();
      return;
    }
    this.confirmacionPago
      .getPendientes(this.sesionId)
      .pipe(catchError(() => of(null)))
      .subscribe((list) => {
        if (list != null) {
          this.applyList(list);
        }
      });
  }

  private ensurePolling(): void {
    if (this.pollingStarted) {
      return;
    }
    this.pollingStarted = true;
    this.pollSub = interval(POLL_MS)
      .pipe(
        switchMap(() => {
          if (this.sesionId == null) {
            return of(null);
          }
          return this.confirmacionPago.getPendientes(this.sesionId).pipe(
            catchError(() => of(null))
          );
        })
      )
      .subscribe((list) => {
        if (list != null) {
          this.applyList(list);
        }
      });
    this.tickSub = interval(1000).subscribe(() => this.tickCountdowns());
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.tickSub?.unsubscribe();
    this.pollSub = undefined;
    this.tickSub = undefined;
    this.pollingStarted = false;
  }

  private applyList(list: PendienteConfirmacionDto[]): void {
    this.items = list || [];

    for (const item of this.items) {
      if (item.estado === 'CONFIRMADA' && !this.countdowns.has(item.id)) {
        this.countdowns.set(item.id, COUNTDOWN_FROM);
      }
    }
    const ids = new Set(this.items.map((i) => i.id));
    for (const id of [...this.countdowns.keys()]) {
      if (!ids.has(id)) {
        this.countdowns.delete(id);
      }
    }

    if (this.items.length === 0) {
      this.stopPolling();
    } else {
      this.ensurePolling();
    }

    const ambigua = this.items.find((i) => i.estado === 'AMBIGUA' || i.ambiguo);
    if (ambigua && !this.ambiguityOpen && ambigua.notificacionId) {
      this.openAmbiguity(ambigua);
    }

    this.cdr.markForCheck();
  }

  private tickCountdowns(): void {
    let changed = false;
    const done: number[] = [];
    for (const [id, left] of this.countdowns.entries()) {
      if (left <= 0) {
        done.push(id);
        continue;
      }
      this.countdowns.set(id, left - 1);
      changed = true;
      if (left - 1 <= 0) {
        done.push(id);
      }
    }
    if (done.length) {
      done.forEach((id) => this.countdowns.delete(id));
      this.confirmacionPago.marcarConfirmadas(done).subscribe({
        next: () => {
          this.items = this.items.filter((i) => !done.includes(i.id));
          if (this.items.length === 0) {
            this.stopPolling();
          }
          this.cdr.markForCheck();
        },
        error: () => {
          /* reintento en próximo poll */
        }
      });
    }
    if (changed || this.items.some((i) => i.estado === 'CREADA')) {
      this.cdr.markForCheck();
    }
  }

  private openAmbiguity(item: PendienteConfirmacionDto): void {
    this.ambiguityOpen = true;
    const ref = this.dialog.open(AmbiguidadPagoDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        notificacionId: item.notificacionId,
        nombrePagador: item.nombrePagador || item.candidatos?.[0]?.nombrePagadorSugerido,
        candidatos: item.candidatos || [],
        monto: item.montoEsperado
      }
    });
    ref.afterClosed().subscribe((chosenId: number | null) => {
      this.ambiguityOpen = false;
      if (chosenId && item.notificacionId) {
        this.asignarConConfirmacionSiDistinto(chosenId, item.notificacionId);
      }
    });
  }

  asociarPago(item: PendienteConfirmacionDto, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (item.estado !== 'CREADA' && item.estado !== 'AMBIGUA') {
      return;
    }
    // Abrir de inmediato: el dialog hace polling de emails sin asignar.
    const ref = this.dialog.open(AsociarNotificacionDialogComponent, {
      width: '440px',
      data: {
        montoEsperado: item.montoEsperado,
        historialElectronicoId: item.id,
        abonoCxcId: item.abonoCxcId,
        historialReciboId: item.historialReciboId,
        metodoPagoId: item.metodoPagoId ?? null,
        notificaciones: []
      }
    });
    ref.afterClosed().subscribe((result: AsociarNotificacionDialogResult | number | null) => {
      const notifId =
        typeof result === 'number'
          ? result
          : result && typeof result === 'object'
            ? result.notificacionId ?? null
            : null;
      const corregido =
        result && typeof result === 'object' ? result.metodoPagoCorregido ?? null : null;
      if (corregido != null) {
        item.metodoPagoId = corregido;
        this.cdr.markForCheck();
        this.revisarPendientes();
      }
      if (notifId) {
        this.asignarConConfirmacionSiDistinto(item.id, notifId);
      }
    });
  }

  private asignarConConfirmacionSiDistinto(
    historialElectronicoId: number,
    notificacionId: number
  ): void {
    this.confirmacionPago.asignar(historialElectronicoId, notificacionId, false).subscribe({
      next: () => this.refreshTrasAsignar(),
      error: (err: MontoDistintoConfirmacionDto | unknown) => {
        if (err && typeof err === 'object' && (err as MontoDistintoConfirmacionDto).code === 'MONTO_DISTINTO') {
          const data = err as MontoDistintoConfirmacionDto;
          const esFaltante = Number(data.diferencia) < 0;
          const ref = this.dialog.open(MontoDistintoPagoDialogComponent, {
            width: '440px',
            disableClose: true,
            data
          });
          ref.afterClosed().subscribe((result: MontoDistintoDialogResult | null) => {
            if (!result?.confirmed) {
              return;
            }
            this.confirmacionPago
              .asignar(
                historialElectronicoId,
                notificacionId,
                true,
                result.origenFondosDevolucionId
              )
              .subscribe({
                next: (dto) => {
                  this.refreshTrasAsignar();
                  if (esFaltante) {
                    this.creditoDesdeFaltante.emit(dto);
                  }
                }
              });
          });
          return;
        }
      }
    });
  }

  private refreshTrasAsignar(): void {
    if (this.sesionId != null) {
      this.confirmacionPago.getPendientes(this.sesionId).subscribe((list) => this.applyList(list));
    }
  }

  countdownOf(id: number): number | null {
    return this.countdowns.has(id) ? (this.countdowns.get(id) as number) : null;
  }

  tiempoEspera(item: PendienteConfirmacionDto): string {
    return this.fechaUtil.formatDateConTiempoRelativo(item.fechaCreacion);
  }

  clienteIdentificado(item: PendienteConfirmacionDto): boolean {
    const n = (item.nombreCliente || '').trim();
    if (!n) {
      return false;
    }
    const lower = n.toLowerCase();
    return lower !== 'anonimo' && lower !== 'anónimo';
  }

  verProductos(item: PendienteConfirmacionDto, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!item.historialReciboId) {
      return;
    }
    this.dialog.open(TicketSinNotifProductosDialogComponent, {
      width: '560px',
      data: {
        historialReciboId: item.historialReciboId,
        numeroVenta: item.numeroVenta,
        total: item.montoEsperado
      }
    });
  }

  yaNoEsperar(item: PendienteConfirmacionDto, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.confirmacionPago.yaNoEsperar(item.id).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.id !== item.id);
        this.countdowns.delete(item.id);
        if (this.items.length === 0) {
          this.stopPolling();
        }
        this.cdr.markForCheck();
      }
    });
  }
}
