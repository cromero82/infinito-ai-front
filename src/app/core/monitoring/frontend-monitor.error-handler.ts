import { ErrorHandler, inject, Injectable } from '@angular/core';
import { ReporteFrontendService } from './reporte-frontend.service';

/**
 * Envía errores de Angular al backend y conserva el log en consola.
 */
@Injectable()
export class FrontendMonitorErrorHandler implements ErrorHandler {
  private readonly reporte = inject(ReporteFrontendService);

  handleError(error: unknown): void {
    try {
      this.reporte.reportFromError(error);
    } catch {
      // Observabilidad no debe impedir el log ni el resto del manejo de errores
    }
    try {
      console.error(error);
    } catch {
      /* consola podría fallar en entornos restringidos */
    }
  }
}
