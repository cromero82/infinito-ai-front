import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FrontendActivityBufferService } from './frontend-activity-buffer.service';
import { REPORTE_FRONTEND_URL_FRAGMENT } from './frontend-monitor.constants';
import { truncarParaMonitoreo } from './frontend-monitor-string.util';

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const stack = error.stack ?? '';
    return stack ? `${error.message}\n${stack}` : error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return truncarParaMonitoreo(JSON.stringify(error));
  } catch {
    return String(error);
  }
}

@Injectable({ providedIn: 'root' })
export class ReporteFrontendService {
  private readonly router = inject(Router);
  private readonly buffer = inject(FrontendActivityBufferService);

  private lastKey = '';
  private lastAt = 0;
  private readonly dedupeMs = 2500;

  /** Errores de zona Angular / componentes. */
  reportFromError(error: unknown): void {
    try {
      this.sendIfNew(formatUnknownError(error));
    } catch {
      // Observabilidad no debe afectar negocio
    }
  }

  /** Promesas rechazadas no capturadas (evento window). */
  reportFromUnhandledRejection(reason: unknown): void {
    try {
      const prefix = 'UnhandledPromiseRejection: ';
      this.sendIfNew(prefix + formatUnknownError(reason));
    } catch {
      // Observabilidad no debe afectar negocio
    }
  }

  /** Fallo HTTP al consumir el backend (4xx, 5xx, red). */
  reportFromHttpFailure(req: HttpRequest<unknown>, err: HttpErrorResponse): void {
    try {
      if (req.url.includes(REPORTE_FRONTEND_URL_FRAGMENT)) {
        return;
      }
      const parts = [
        `HTTP error ${err.status} ${err.statusText || ''}`.trim(),
        `${req.method} ${req.url}`,
        err.message
      ];
      const body = err.error;
      if (body !== undefined && body !== null) {
        let text: string;
        if (typeof body === 'string') {
          text = body;
        } else {
          try {
            text = truncarParaMonitoreo(JSON.stringify(body));
          } catch {
            text = '[cuerpo no serializable]';
          }
        }
        parts.push(`cuerpo: ${text}`);
      }
      this.sendIfNew(parts.filter(Boolean).join('\n'));
    } catch {
      // Observabilidad no debe afectar negocio
    }
  }

  private sendIfNew(errorText: string): void {
    try {
      if (environment.reporteFrontendDeshabilitado === true) {
        return;
      }
      const url = this.router.url || '/';
      const actividad = this.buffer.snapshot();
      const key = `${url}\n${errorText}`;
      const now = Date.now();
      if (key === this.lastKey && now - this.lastAt < this.dedupeMs) {
        return;
      }
      this.lastKey = key;
      this.lastAt = now;
      void this.postReporteFireAndForget(url, actividad, errorText);
    } catch {
      // Router/buffer no deben tumbar el flujo si fallan de forma inesperada
    }
  }

  /**
   * POST a /reporte-frontend usando fetch (sin HttpClient).
   * El backend responde **202 Accepted sin cuerpo**: no se llama a `.json()` ni se espera payload.
   * Fire-and-forget: errores de red o del reporte no propagan.
   */
  private postReporteFireAndForget(url: string, actividadReciente: string, error: string): void {
    let payload: string;
    try {
      payload = JSON.stringify({ url, actividadReciente, error });
    } catch {
      try {
        payload = JSON.stringify({
          url: String(url).slice(0, 500),
          actividadReciente: '[no serializable]',
          error: String(error).slice(0, 2000)
        });
      } catch {
        return;
      }
    }

    const base = environment.apiUrlRelationalDb?.replace(/\/$/, '') ?? '';
    const endpoint = `${base}/${REPORTE_FRONTEND_URL_FRAGMENT}`;
    let token: string | null = null;
    try {
      token = typeof localStorage !== 'undefined' ? localStorage.getItem('user-token') : null;
    } catch {
      token = null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    void fetch(endpoint, {
      method: 'POST',
      headers,
      body: payload,
      keepalive: true
    })
      .then(res => {
        // 202 sin cuerpo: éxito sin leer body. Cualquier fallo HTTP aquí se ignora para no impactar negocio.
        void res.status;
      })
      .catch(() => {
        /* red, CORS, abort: ignorar */
      });
  }
}
