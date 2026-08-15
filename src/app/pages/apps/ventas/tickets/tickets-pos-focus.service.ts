import { Injectable, NgZone } from '@angular/core';

export type TicketsPosFocusOptions = {
  /** Seleccionar el texto del input al enfocar (default: true). */
  select?: boolean;
  /** Ignorar holds (uso excepcional y documentado). */
  force?: boolean;
};

/**
 * Coordinador de foco del buscador POS (`#productSearchInput`).
 *
 * - `hold` / `release`: mientras haya holds (modal, edición inline, menú), no se restaura el buscador.
 * - `requestDefaultFocus`: único camino preferido para devolver el caret al input.
 * - Barcode buffer: permite escaneo aunque el foco visual no esté en el input (con exclusiones).
 *
 * @see `.cursor/rules/tickets-pos-focus-coordinator.md`
 */
@Injectable()
export class TicketsPosFocusService {
  private inputEl: HTMLInputElement | null = null;
  private readonly holds = new Set<string>();
  private enabled = false;
  private suppressUntilMs = 0;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private barcodeBuffer = '';
  private barcodeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly barcodeIdleMs = 80;
  private onBarcodeCommit: ((text: string) => void) | null = null;

  constructor(private readonly zone: NgZone) {}

  attachInput(el: HTMLInputElement | null | undefined): void {
    this.inputEl = el ?? null;
  }

  setBarcodeCommitHandler(handler: ((text: string) => void) | null): void {
    this.onBarcodeCommit = handler;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.clearTimers();
    this.holds.clear();
    this.resetBarcodeBuffer();
  }

  hold(reason: string): void {
    if (!reason) {
      return;
    }
    this.holds.add(reason);
    this.clearRestoreTimers();
  }

  release(reason: string): void {
    if (!reason) {
      return;
    }
    this.holds.delete(reason);
    if (this.holds.size === 0) {
      this.requestDefaultFocus({ select: false });
    }
  }

  releaseQuiet(reason: string): void {
    if (!reason) {
      return;
    }
    this.holds.delete(reason);
  }

  isHeld(): boolean {
    return this.holds.size > 0;
  }

  hasHold(reason: string): boolean {
    return this.holds.has(reason);
  }

  /** Equivalente al antiguo suppressProductSearchFocusUntil. */
  suppressFor(ms: number): void {
    this.suppressUntilMs = Math.max(this.suppressUntilMs, Date.now() + ms);
  }

  clearSuppress(): void {
    this.suppressUntilMs = 0;
  }

  /**
   * Programa el foco en `#productSearchInput` si no hay holds / suppress.
   * Un solo schedule + un reintento corto (Material a veces re-enfoca el tab).
   */
  requestDefaultFocus(options: TicketsPosFocusOptions = {}): void {
    if (!this.enabled) {
      return;
    }
    const select = options.select !== false;
    const force = options.force === true;

    if (!force) {
      if (this.holds.size > 0) {
        return;
      }
      if (Date.now() < this.suppressUntilMs) {
        return;
      }
    }

    this.clearRestoreTimers();

    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.restoreTimer = setTimeout(() => {
          this.zone.run(() => {
            const ok = this.applyFocus(select);
            if (!ok && (force || this.holds.size === 0)) {
              this.retryTimer = setTimeout(() => {
                this.zone.run(() => this.applyFocus(select));
              }, 180);
            }
          });
        }, 40);
      });
    });
  }

  /**
   * Si el foco salió hacia un destino no permitido y no hay hold, restaurar.
   */
  onFocusOut(relatedTarget: EventTarget | null): void {
    if (!this.enabled || this.holds.size > 0) {
      return;
    }
    if (Date.now() < this.suppressUntilMs) {
      return;
    }
    if (this.isAllowedFocusTarget(relatedTarget)) {
      return;
    }
    this.requestDefaultFocus({ select: false });
  }

  /**
   * Captura teclas para lectora cuando el foco no está en un campo de texto legítimo.
   * @returns true si el evento fue consumido (caller puede preventDefault).
   */
  handlePossibleBarcodeKeydown(event: KeyboardEvent): boolean {
    if (!this.enabled || this.holds.size > 0) {
      return false;
    }
    if (Date.now() < this.suppressUntilMs) {
      return false;
    }
    if (!this.onBarcodeCommit) {
      return false;
    }

    const target = event.target as Node | null;
    if (this.isTypingTarget(target) && target !== this.inputEl) {
      return false;
    }
    // Si ya está en el buscador, el input nativo maneja la tecla.
    if (target === this.inputEl || document.activeElement === this.inputEl) {
      return false;
    }
    if (this.isInsideOverlay(target)) {
      return false;
    }

    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }

    if (event.key === 'Enter') {
      const text = this.barcodeBuffer.trim();
      this.resetBarcodeBuffer();
      if (!text) {
        return false;
      }
      this.onBarcodeCommit(text);
      this.requestDefaultFocus({ select: false });
      return true;
    }

    if (event.key.length !== 1) {
      return false;
    }

    this.barcodeBuffer += event.key;
    if (this.barcodeTimer) {
      clearTimeout(this.barcodeTimer);
    }
    this.barcodeTimer = setTimeout(() => this.resetBarcodeBuffer(), this.barcodeIdleMs);
    return true;
  }

  isAllowedFocusTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || !(el instanceof Node)) {
      return false;
    }
    if (this.inputEl && (el === this.inputEl || this.inputEl.contains(el))) {
      return true;
    }
    if (this.isInsideOverlay(el)) {
      return true;
    }
    if (this.isTypingTarget(el)) {
      return true;
    }
    // Tabs / botones del panel: no son destinos “finales”; se restaurará.
    return false;
  }

  private applyFocus(select: boolean): boolean {
    if (!this.inputEl) {
      return false;
    }
    if (this.holds.size > 0 && Date.now() >= this.suppressUntilMs) {
      // Sin force: no enfocar si hay hold activo.
      return false;
    }
    try {
      this.inputEl.focus({ preventScroll: true });
      if (select) {
        this.inputEl.select();
      }
    } catch {
      return false;
    }
    return document.activeElement === this.inputEl;
  }

  private isTypingTarget(node: Node | null): boolean {
    if (!node || !(node instanceof HTMLElement)) {
      return false;
    }
    const tag = node.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return true;
    }
    if (node.isContentEditable) {
      return true;
    }
    return !!node.closest('input, textarea, select, [contenteditable="true"]');
  }

  private isInsideOverlay(node: Node | null): boolean {
    if (!node || !(node instanceof HTMLElement)) {
      return false;
    }
    return !!node.closest('.cdk-overlay-container, .mat-mdc-dialog-container, .mat-mdc-menu-panel');
  }

  private resetBarcodeBuffer(): void {
    this.barcodeBuffer = '';
    if (this.barcodeTimer) {
      clearTimeout(this.barcodeTimer);
      this.barcodeTimer = null;
    }
  }

  private clearRestoreTimers(): void {
    if (this.restoreTimer) {
      clearTimeout(this.restoreTimer);
      this.restoreTimer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearRestoreTimers();
    this.resetBarcodeBuffer();
  }
}
