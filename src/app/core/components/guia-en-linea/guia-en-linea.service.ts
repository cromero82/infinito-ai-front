import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { GuiaEnLineaConfig } from './guia-en-linea.types';
import { GuiaEnLineaOverlayComponent } from './guia-en-linea-overlay.component';

@Injectable({ providedIn: 'root' })
export class GuiaEnLineaService {
  private overlayRef: OverlayRef | null = null;

  constructor(private readonly overlay: Overlay) {}

  get isOpen(): boolean {
    return !!this.overlayRef?.hasAttached();
  }

  abrir(config: GuiaEnLineaConfig): void {
    this.cerrar();

    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      panelClass: 'guia-en-linea-overlay-pane',
      positionStrategy: this.overlay.position().global().top('0').left('0'),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '100vw',
      height: '100vh'
    });

    const portal = new ComponentPortal(GuiaEnLineaOverlayComponent);
    const ref = this.overlayRef.attach(portal);
    ref.instance.config = config;
    ref.instance.cerrar.subscribe(() => this.cerrar());
  }

  cerrar(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
