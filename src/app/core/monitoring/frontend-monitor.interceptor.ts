import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { FrontendActivityBufferService } from './frontend-activity-buffer.service';
import { ReporteFrontendService } from './reporte-frontend.service';
import { REPORTE_FRONTEND_URL_FRAGMENT } from './frontend-monitor.constants';
import { truncarParaMonitoreo } from './frontend-monitor-string.util';

/** No registrar en el buffer circular peticiones a assets estáticos (Fetch/XHR vía HttpClient). */
function isStaticAssetUrl(url: string): boolean {
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(?:svg|js|css|png|jpg)$/.test(path);
}

function serializeRequestBody(req: HttpRequest<unknown>): string {
  const body = req.body;
  if (body == null || body === '') {
    return '';
  }
  if (typeof body === 'string') {
    return truncarParaMonitoreo(body);
  }
  if (body instanceof FormData || body instanceof Blob) {
    return '[FormData o Blob]';
  }
  if (typeof body === 'object') {
    try {
      return truncarParaMonitoreo(JSON.stringify(body));
    } catch {
      return '[objeto no serializable]';
    }
  }
  return truncarParaMonitoreo(String(body));
}

function requestToActivityLine(req: HttpRequest<unknown>): string {
  const payload = serializeRequestBody(req);
  if (payload) {
    return `ejecuta endpoint: ${req.method} ${req.url} payload: ${payload}`;
  }
  return `ejecuta endpoint: ${req.method} ${req.url}`;
}

export const frontendMonitorInterceptor: HttpInterceptorFn = (req, next) => {
  const buffer = inject(FrontendActivityBufferService);
  const reporte = inject(ReporteFrontendService);

  const skipActivity =
    req.url.includes(REPORTE_FRONTEND_URL_FRAGMENT) || isStaticAssetUrl(req.url);

  if (!skipActivity) {
    try {
      buffer.record(requestToActivityLine(req));
    } catch {
      /* monitoreo no debe bloquear la petición */
    }
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      try {
        if (error instanceof HttpErrorResponse && !req.url.includes(REPORTE_FRONTEND_URL_FRAGMENT)) {
          reporte.reportFromHttpFailure(req, error);
        }
      } catch {
        /* observabilidad no debe alterar el error original */
      }
      return throwError(() => error);
    })
  );
};
