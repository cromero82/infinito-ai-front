import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  GuiaEnLineaConfig,
  GuiaEnLineaTarget
} from './guia-en-linea.types';

interface HighlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
  etiqueta?: string;
  esDestino?: boolean;
}

@Component({
  selector: 'app-guia-en-linea-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './guia-en-linea-overlay.component.html',
  styleUrls: ['./guia-en-linea-overlay.component.scss']
})
export class GuiaEnLineaOverlayComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) config!: GuiaEnLineaConfig;
  @Output() cerrar = new EventEmitter<void>();

  highlights: HighlightBox[] = [];
  popoverStyle: Record<string, string> = {};
  arrowStyle: Record<string, string> = {};
  private destinoEl: HTMLElement | null = null;
  private resizeObs: ResizeObserver | null = null;

  private readonly onScroll = (): void => this.recalcular();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.recalcular();
      this.observe();
    });
    document.addEventListener('scroll', this.onScroll, true);
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    document.removeEventListener('scroll', this.onScroll, true);
  }

  @HostListener('window:resize')
  onViewportChange(): void {
    this.recalcular();
  }

  onCerrar(): void {
    this.config.onCerrar?.();
    this.cerrar.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Solo cerrar si el clic es en el backdrop, no en popover/highlights
    const t = event.target as HTMLElement | null;
    if (t?.classList.contains('guia-backdrop')) {
      this.onCerrar();
    }
  }

  private observe(): void {
    this.resizeObs = new ResizeObserver(() => this.recalcular());
    for (const el of this.resolveAllElements()) {
      this.resizeObs.observe(el);
    }
  }

  private resolveTarget(t: GuiaEnLineaTarget): HTMLElement | null {
    if (typeof t.el === 'string') {
      return document.querySelector<HTMLElement>(t.el);
    }
    return t.el ?? null;
  }

  private resolveAllElements(): HTMLElement[] {
    const out: HTMLElement[] = [];
    for (const o of this.config.origenes ?? []) {
      const el = this.resolveTarget(o);
      if (el) {
        out.push(el);
      }
    }
    const dest = this.resolveTarget(this.config.destino);
    if (dest) {
      out.push(dest);
    }
    return out;
  }

  private recalcular(): void {
    const boxes: HighlightBox[] = [];
    for (const o of this.config.origenes ?? []) {
      const el = this.resolveTarget(o);
      if (!el) {
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) {
        continue;
      }
      boxes.push({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        etiqueta: o.etiqueta
      });
    }

    this.destinoEl = this.resolveTarget(this.config.destino);
    if (this.destinoEl) {
      this.destinoEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const r = this.destinoEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        boxes.push({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          etiqueta: this.config.destino.etiqueta,
          esDestino: true
        });
        this.posicionarPopover(r);
      }
    }

    this.highlights = boxes;
    this.cdr.markForCheck();
  }

  private posicionarPopover(destino: DOMRect): void {
    const popW = Math.min(360, window.innerWidth - 32);
    const margin = 12;
    let left = destino.left + destino.width / 2 - popW / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - popW - 16));

    // Preferir arriba del destino; si no cabe, abajo
    const estimatedH = 180;
    const spaceAbove = destino.top - margin;
    const placeAbove = spaceAbove >= estimatedH || spaceAbove > window.innerHeight - destino.bottom;

    let top: number;
    if (placeAbove) {
      top = Math.max(16, destino.top - estimatedH - margin);
    } else {
      top = Math.min(destino.bottom + margin, window.innerHeight - estimatedH - 16);
    }

    this.popoverStyle = {
      top: `${top}px`,
      left: `${left}px`,
      width: `${popW}px`
    };

    // Flecha desde el borde del popover hacia el centro del destino
    const arrowX = Math.min(
      Math.max(destino.left + destino.width / 2 - left, 24),
      popW - 24
    );
    this.arrowStyle = {
      left: `${arrowX}px`,
      [placeAbove ? 'bottom' : 'top']: '-10px',
      transform: placeAbove ? 'rotate(45deg)' : 'rotate(225deg)'
    };
  }
}
