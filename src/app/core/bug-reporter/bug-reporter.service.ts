import { Injectable } from '@angular/core';

export interface CapturedRequest {
  id: number;
  timestamp: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  responseStatus: number;
  responseStatusText: string;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  /** Solo se incluye si la petición supera 120s. */
  durationMs?: number;
  source?: string;
}

export interface BugReport {
  exportedAt: string;
  user: string | null;
  route: string;
  userAgent: string;
  requests: CapturedRequest[];
}

@Injectable({ providedIn: 'root' })
export class BugReporterService {
  private requests: CapturedRequest[] = [];
  private nextId = 1;
  private maxEntries = 200;

  add(request: Omit<CapturedRequest, 'id'>): void {
    const entry: CapturedRequest = { id: this.nextId++, ...request };
    // No persistir durationMs si viene en 0/undefined por spreads previos.
    if (entry.durationMs == null) {
      delete entry.durationMs;
    }
    this.requests.push(entry);
    if (this.requests.length > this.maxEntries) {
      this.requests = this.requests.slice(-this.maxEntries);
    }
  }

  getAll(): CapturedRequest[] {
    return [...this.requests];
  }

  count(): number {
    return this.requests.length;
  }

  addManual(entry: {
    method: string;
    url: string;
    requestBody?: unknown;
    responseStatus: number;
    responseStatusText?: string;
    responseBody?: unknown;
    durationMs?: number;
    source?: string;
  }): void {
    this.add({
      timestamp: new Date().toISOString(),
      method: entry.method,
      url: entry.url,
      requestHeaders: {},
      requestBody: entry.requestBody ?? null,
      responseStatus: entry.responseStatus,
      responseStatusText: entry.responseStatusText ?? '',
      responseHeaders: {},
      responseBody: entry.responseBody ?? null,
      durationMs: durationMsIfSlow(entry.durationMs),
      source: entry.source
    });
  }

  clear(): void {
    this.requests = [];
    this.nextId = 1;
  }

  getById(id: number): CapturedRequest | undefined {
    const found = this.requests.find((r) => r.id === id);
    return found ? structuredCloneSafe(found) : undefined;
  }

  update(id: number, patch: Partial<CapturedRequest>): boolean {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx < 0) {
      return false;
    }
    const { id: _ignore, ...rest } = patch;
    this.requests[idx] = { ...this.requests[idx], ...rest, id };
    return true;
  }

  replace(id: number, entry: CapturedRequest): boolean {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx < 0) {
      return false;
    }
    this.requests[idx] = { ...entry, id };
    return true;
  }

  remove(id: number): boolean {
    const before = this.requests.length;
    this.requests = this.requests.filter((r) => r.id !== id);
    return this.requests.length < before;
  }

  /** Elimina claves por path (`responseBody.data`, `requestHeaders`). */
  removePaths(id: number, paths: string[]): boolean {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx < 0 || !paths.length) {
      return false;
    }
    const clone = structuredCloneSafe(this.requests[idx]) as unknown as Record<
      string,
      unknown
    >;
    for (const path of paths) {
      deletePath(clone, path);
    }
    this.requests[idx] = clone as unknown as CapturedRequest;
    return true;
  }

  exportJson(route: string): BugReport {
    return {
      exportedAt: new Date().toISOString(),
      user: typeof localStorage !== 'undefined' ? localStorage.getItem('user-nombre') : null,
      route,
      userAgent: navigator.userAgent,
      requests: this.getAll().map((r) => sanitizeCapturedRequest(r))
    };
  }

  downloadJson(route: string): void {
    const report = this.exportJson(route);
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bug-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/** Umbral (ms) para conservar durationMs en el reporte. */
export const DURATION_KEEP_THRESHOLD_MS = 120_000;

export function durationMsIfSlow(
  durationMs: number | null | undefined
): number | undefined {
  if (durationMs == null || Number.isNaN(durationMs)) {
    return undefined;
  }
  return durationMs > DURATION_KEEP_THRESHOLD_MS ? durationMs : undefined;
}

const OMITTED_HEADER_NAMES = new Set([
  'cache-control',
  'expires',
  'pragma'
]);

function omitNoiseHeaders(
  headers: Record<string, string> | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) {
    return out;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (OMITTED_HEADER_NAMES.has(key.toLowerCase())) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** Limpia ruido al exportar (también aplica a capturas previas en memoria). */
function sanitizeCapturedRequest(req: CapturedRequest): CapturedRequest {
  const cleaned: CapturedRequest = {
    ...req,
    requestHeaders: omitNoiseHeaders(req.requestHeaders),
    responseHeaders: omitNoiseHeaders(req.responseHeaders)
  };
  const slow = durationMsIfSlow(req.durationMs);
  if (slow != null) {
    cleaned.durationMs = slow;
  } else {
    delete cleaned.durationMs;
  }
  return cleaned;
}

function structuredCloneSafe<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

function deletePath(root: Record<string, unknown>, path: string): void {
  const parts = path.split('.').filter(Boolean);
  if (!parts.length) {
    return;
  }
  let cursor: unknown = root;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cursor == null || typeof cursor !== 'object' || Array.isArray(cursor)) {
      return;
    }
    cursor = (cursor as Record<string, unknown>)[parts[i]];
  }
  if (cursor == null || typeof cursor !== 'object' || Array.isArray(cursor)) {
    return;
  }
  delete (cursor as Record<string, unknown>)[parts[parts.length - 1]];
}
