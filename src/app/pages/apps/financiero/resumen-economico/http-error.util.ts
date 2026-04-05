import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae texto de error de respuestas HTTP (p. ej. 409 con JSON `{ "mensaje": "..." }`).
 */
export function httpErrorMessage(err: unknown, fallback = 'Error en la solicitud'): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body != null && typeof body === 'object' && !Array.isArray(body)) {
      const o = body as Record<string, unknown>;
      const m1 = o['mensaje'];
      const m2 = o['message'];
      if (typeof m1 === 'string' && m1.trim()) return m1;
      if (typeof m2 === 'string' && m2.trim()) return m2;
    }
    if (typeof body === 'string') {
      const t = body.trim();
      if (t.startsWith('{')) {
        try {
          const j = JSON.parse(t) as { mensaje?: string; message?: string };
          if (j.mensaje?.trim()) return j.mensaje;
          if (j.message?.trim()) return j.message;
        } catch {
          /* ignore */
        }
      }
      if (t) return t;
    }
    return fallback;
  }
  const e = err as { message?: string } | null | undefined;
  return typeof e?.message === 'string' && e.message.trim() ? e.message : fallback;
}
