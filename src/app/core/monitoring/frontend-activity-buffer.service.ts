import { Injectable } from '@angular/core';
import {
  FRONTEND_MONITOR_MAX_ACTIONS,
  REPORTE_FRONTEND_URL_FRAGMENT
} from './frontend-monitor.constants';

/**
 * Buffer circular en memoria de las últimas acciones (breadcrumbs) para adjuntar al reporte de fallos.
 */
@Injectable({ providedIn: 'root' })
export class FrontendActivityBufferService {
  private readonly lines: string[] = [];

  /**
   * Registra una acción legible, p. ej. "despliega modal: selector-productos".
   * Ignora entradas relacionadas con el propio endpoint de reporte.
   */
  record(message: string): void {
    try {
      const trimmed = (message ?? '').trim();
      if (!trimmed) {
        return;
      }
      if (trimmed.includes(REPORTE_FRONTEND_URL_FRAGMENT)) {
        return;
      }
      this.lines.push(trimmed);
      if (this.lines.length > FRONTEND_MONITOR_MAX_ACTIONS) {
        this.lines.splice(0, this.lines.length - FRONTEND_MONITOR_MAX_ACTIONS);
      }
    } catch {
      // El monitoreo no debe afectar la operación de negocio
    }
  }

  /** Últimas N acciones unidas con salto de línea (campo actividadReciente). */
  snapshot(): string {
    try {
      return this.lines.join('\n');
    } catch {
      return '';
    }
  }
}
