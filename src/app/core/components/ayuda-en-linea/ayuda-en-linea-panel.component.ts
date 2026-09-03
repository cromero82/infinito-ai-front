import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AyudaEnLineaContenido } from './ayuda-en-linea.types';

const PANEL_W = 360;

@Component({
  selector: 'app-ayuda-en-linea-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (abierto && contenido) {
      <aside
        class="ayuda-en-linea-panel"
        [class.ayuda-en-linea-panel--dragging]="dragging"
        [ngStyle]="panelStyle"
        role="dialog"
        [attr.aria-label]="contenido.titulo">
        <header
          class="ayuda-panel-header"
          (pointerdown)="onDragStart($event)"
          title="Arrastrar · doble clic restaura posición"
          (dblclick)="resetPosition()">
          <mat-icon svgIcon="mat:info" class="ayuda-panel-header-icon"></mat-icon>
          <span class="ayuda-panel-title">Ayuda en línea</span>
          <button
            type="button"
            mat-icon-button
            class="ayuda-panel-close"
            matTooltip="Cerrar"
            aria-label="Cerrar ayuda en línea"
            (pointerdown)="$event.stopPropagation()"
            (click)="cerrar.emit()">
            <mat-icon svgIcon="mat:close"></mat-icon>
          </button>
        </header>
        <div class="ayuda-panel-body">
          <h3 class="ayuda-panel-screen">{{ contenido.titulo }}</h3>
          <p class="ayuda-panel-resumen">{{ contenido.resumen }}</p>
          @if (contenido.tips?.length) {
            <ul class="ayuda-panel-tips">
              @for (t of contenido.tips; track t) {
                <li>{{ t }}</li>
              }
            </ul>
          }
          <h4 class="ayuda-panel-acciones-title">Qué puedes hacer aquí</h4>
          <ul class="ayuda-panel-acciones">
            @for (a of contenido.acciones; track a.titulo) {
              <li>
                <strong>{{ a.titulo }}</strong>
                <span>{{ a.detalle }}</span>
              </li>
            }
          </ul>
        </div>
      </aside>
    }
  `,
  styles: [
    `
      .ayuda-en-linea-panel {
        position: fixed;
        right: 24px;
        top: 120px;
        z-index: 1200;
        width: min(${PANEL_W}px, calc(100vw - 32px));
        max-height: min(70vh, 560px);
        display: flex;
        flex-direction: column;
        border-radius: 10px;
        overflow: hidden;
        background: #f7f9fc;
        color: #1a2332;
        border: 1px solid rgba(26, 35, 50, 0.14);
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.18);
        font-size: 14px;
        user-select: none;
      }
      .ayuda-en-linea-panel--dragging {
        opacity: 0.95;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.24);
      }
      .ayuda-panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 8px 10px 12px;
        background: #3d5474;
        color: #f2f5f8;
        cursor: grab;
        touch-action: none;
      }
      .ayuda-en-linea-panel--dragging .ayuda-panel-header {
        cursor: grabbing;
      }
      .ayuda-panel-header-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
      .ayuda-panel-title {
        flex: 1 1 auto;
        font-weight: 600;
        font-size: 14px;
        min-width: 0;
      }
      .ayuda-panel-close {
        color: #f2f5f8;
        width: 36px;
        height: 36px;
      }
      .ayuda-panel-body {
        padding: 12px 14px 16px;
        overflow: auto;
        min-height: 0;
        user-select: text;
      }
      .ayuda-panel-screen {
        margin: 0 0 6px;
        font-size: 15px;
        font-weight: 700;
      }
      .ayuda-panel-resumen {
        margin: 0 0 10px;
        line-height: 1.4;
        color: #3a4a5e;
      }
      .ayuda-panel-tips {
        margin: 0 0 12px;
        padding-left: 1.1rem;
        color: #4a5a70;
        line-height: 1.4;
      }
      .ayuda-panel-acciones-title {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #5a6a7e;
      }
      .ayuda-panel-acciones {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ayuda-panel-acciones li {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
        border-radius: 6px;
        background: #fff;
        border: 1px solid rgba(26, 35, 50, 0.1);
      }
      .ayuda-panel-acciones strong {
        font-size: 13px;
      }
      .ayuda-panel-acciones span {
        font-size: 12px;
        line-height: 1.35;
        color: #5a6a7e;
      }
    `
  ]
})
export class AyudaEnLineaPanelComponent implements OnChanges {
  @Input() abierto = false;
  @Input() contenido: AyudaEnLineaContenido | null = null;
  @Output() cerrar = new EventEmitter<void>();

  panelLeft: number | null = null;
  panelTop: number | null = null;
  dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['abierto'] && this.abierto && this.panelLeft == null) {
      this.placeDefault();
    }
  }

  get panelStyle(): Record<string, string> | null {
    if (this.panelLeft == null || this.panelTop == null) {
      return null;
    }
    return {
      left: `${this.panelLeft}px`,
      top: `${this.panelTop}px`,
      right: 'auto'
    };
  }

  onDragStart(ev: PointerEvent): void {
    if ((ev.target as HTMLElement)?.closest('button')) {
      return;
    }
    const el = (ev.currentTarget as HTMLElement)?.closest(
      '.ayuda-en-linea-panel'
    ) as HTMLElement | null;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    this.panelLeft = rect.left;
    this.panelTop = rect.top;
    this.dragOffsetX = ev.clientX - rect.left;
    this.dragOffsetY = ev.clientY - rect.top;
    this.dragging = true;
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
    this.cdr.markForCheck();
  }

  @HostListener('document:pointermove', ['$event'])
  onDragMove(ev: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const maxL = Math.max(8, window.innerWidth - PANEL_W - 8);
    const maxT = Math.max(8, window.innerHeight - 120);
    this.panelLeft = Math.min(maxL, Math.max(8, ev.clientX - this.dragOffsetX));
    this.panelTop = Math.min(maxT, Math.max(8, ev.clientY - this.dragOffsetY));
    this.cdr.markForCheck();
  }

  @HostListener('document:pointerup')
  onDragEnd(): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.cdr.markForCheck();
  }

  resetPosition(): void {
    this.placeDefault();
    this.cdr.markForCheck();
  }

  private placeDefault(): void {
    this.panelLeft = Math.max(8, window.innerWidth - PANEL_W - 24);
    this.panelTop = 120;
  }
}
