import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { FrontendActivityBufferService } from './frontend-activity-buffer.service';
import { ReporteFrontendService } from './reporte-frontend.service';

/**
 * Registra listeners globales y navegación para enriquecer el buffer de actividad
 * y reportar rechazos de promesas no capturados.
 */
@Injectable({ providedIn: 'root' })
export class FrontendMonitorLifecycleService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly buffer = inject(FrontendActivityBufferService);
  private readonly reporte = inject(ReporteFrontendService);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      try {
        this.buffer.record(`navegación: ${e.urlAfterRedirects}`);
      } catch {
        /* no afectar navegación */
      }
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      try {
        this.reporte.reportFromUnhandledRejection(event.reason);
      } catch {
        /* no afectar el rechazo original */
      }
    });
  }
}
