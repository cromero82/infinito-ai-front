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
  durationMs: number;
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
    durationMs: number;
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
      durationMs: entry.durationMs,
      source: entry.source
    });
  }

  clear(): void {
    this.requests = [];
    this.nextId = 1;
  }

  exportJson(route: string): BugReport {
    return {
      exportedAt: new Date().toISOString(),
      user: typeof localStorage !== 'undefined' ? localStorage.getItem('user-nombre') : null,
      route,
      userAgent: navigator.userAgent,
      requests: this.getAll()
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
