import { HttpErrorResponse, HttpEvent, HttpEventType, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { BugReporterService } from './bug-reporter.service';

const STATIC_ASSET_EXTENSIONS = /\.(?:svg|jpg|jpeg|png|gif|ico|webp|woff|woff2|ttf|eot|css|js|map)$/i;

function isStaticAsset(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];
  return STATIC_ASSET_EXTENSIONS.test(path);
}

const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token']);

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase()) && value.length > 20) {
      result[key] = value.slice(0, 20) + '... [truncated]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

function safeCloneBody(body: unknown): unknown {
  if (body == null || body === '') return null;
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return body; }
  }
  if (body instanceof FormData) return '[FormData]';
  if (body instanceof Blob) return `[Blob: ${body.type}, ${body.size} bytes]`;
  if (typeof body === 'object') {
    try { return JSON.parse(JSON.stringify(body)); } catch { return '[circular]'; }
  }
  return body;
}

export const bugReporterInterceptor: HttpInterceptorFn = (req, next) => {
  const service = inject(BugReporterService);

  if (isStaticAsset(req.url)) {
    return next(req);
  }

  const startTime = performance.now();
  const rawRequestHeaders: Record<string, string> = {};
  req.headers.keys().forEach(key => { rawRequestHeaders[key] = req.headers.get(key) ?? ''; });
  const requestHeaders = sanitizeHeaders(rawRequestHeaders);

  return next(req).pipe(
    tap({
      next: (event: HttpEvent<unknown>) => {
        if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<unknown>;
          const rawResponseHeaders: Record<string, string> = {};
          response.headers.keys().forEach(key => { rawResponseHeaders[key] = response.headers.get(key) ?? ''; });
          const responseHeaders = sanitizeHeaders(rawResponseHeaders);

          service.add({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            requestHeaders,
            requestBody: safeCloneBody(req.body),
            responseStatus: response.status,
            responseStatusText: response.statusText,
            responseHeaders,
            responseBody: safeCloneBody(response.body),
            durationMs: Math.round(performance.now() - startTime)
          });
        }
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          const rawErrorHeaders: Record<string, string> = {};
          error.headers.keys().forEach(key => { rawErrorHeaders[key] = error.headers.get(key) ?? ''; });
          const responseHeaders = sanitizeHeaders(rawErrorHeaders);

          service.add({
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            requestHeaders,
            requestBody: safeCloneBody(req.body),
            responseStatus: error.status,
            responseStatusText: error.statusText,
            responseHeaders,
            responseBody: safeCloneBody(error.error),
            durationMs: Math.round(performance.now() - startTime)
          });
        }
      }
    })
  );
};
