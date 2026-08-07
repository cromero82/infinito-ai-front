import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription, interval, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  ConfirmacionPagoService,
  PendienteConfirmacionDto
} from '../service/confirmacion-pago.service';
import { AmbiguidadPagoDialogComponent } from './ambiguidad-pago-dialog.component';

const POLL_MS = 2500;
const COUNTDOWN_FROM = 6;
const POS_STORAGE_KEY = 'confirmacion-pagos-panel-pos';
const PANEL_W = 280;
const PANEL_H_MIN = 120;

@Component({
  selector: 'app-confirmacion-pagos-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './confirmacion-pagos-panel.component.html',
  styleUrls: ['./confirmacion-pagos-panel.component.scss']
})
export class ConfirmacionPagosPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() sesionId: number | null = null;

  items: PendienteConfirmacionDto[] = [];
  countdowns = new Map<number, number>();

  panelLeft: number | null = null;
  panelTop: number | null = null;
  dragging = false;

  private pollSub?: Subscription;
  private tickSub?: Subscription;
  private ambiguityOpen = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private pollingStarted = false;

  constructor(
    private confirmacionPago: ConfirmacionPagoService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.restorePosition();
  }

  ngOnInit(): void {
    if (this.sesionId != null && !this.pollingStarted) {
      this.startPolling();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sesionId']) {
      this.stopPolling();
      this.items = [];
      this.countdowns.clear();
      if (this.sesionId != null) {
        this.startPolling();
      }
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  get visible(): boolean {
    return this.items.length > 0;
  }

  get panelStyle(): Record<string, string> | null {
    if (this.panelLeft == null || this.panelTop == null) {
      return null;
    }
    return {
      left: `${this.panelLeft}px`,
      top: `${this.panelTop}px`,
      right: 'auto',
      bottom: 'auto'
    };
  }

  trackById(_: number, item: PendienteConfirmacionDto): number {
    return item.id;
  }

  onDragStart(event: PointerEvent): void {
    if (event.button !== 0) {
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

  private startPolling(): void {
    this.stopPolling();
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

    if (this.sesionId != null) {
      this.confirmacionPago
        .getPendientes(this.sesionId)
        .pipe(catchError(() => of(null)))
        .subscribe((list) => {
          if (list != null) {
            this.applyList(list);
          }
        });
    }

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
          this.cdr.markForCheck();
        },
        error: () => {
          /* reintento en próximo poll */
        }
      });
    }
    if (changed) {
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
        this.confirmacionPago.asignar(chosenId, item.notificacionId).subscribe({
          next: () => {
            if (this.sesionId != null) {
              this.confirmacionPago.getPendientes(this.sesionId).subscribe((list) => this.applyList(list));
            }
          }
        });
      }
    });
  }

  countdownOf(id: number): number | null {
    return this.countdowns.has(id) ? (this.countdowns.get(id) as number) : null;
  }
}
