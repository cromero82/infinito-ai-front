import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
  BugReporterService,
  CapturedRequest
} from './bug-reporter.service';

export interface JsonSectionItem {
  path: string;
  label: string;
  depth: number;
  selected: boolean;
}

/** Secciones de una petición que suelen sobrar al depurar. */
const EDITABLE_ROOT_SECTIONS: { path: string; label: string }[] = [
  { path: 'requestHeaders', label: 'Headers de request' },
  { path: 'requestParams', label: 'Query params (HttpParams)' },
  { path: 'requestBody', label: 'Body de request' },
  { path: 'responseHeaders', label: 'Headers de response' },
  { path: 'responseBody', label: 'Body de response' },
  { path: 'responseStatusText', label: 'Status text' },
  { path: 'source', label: 'Source' }
];

@Component({
  selector: 'vex-bug-reporter-detail-dialog',
  imports: [
    DatePipe,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './bug-reporter-detail-dialog.component.html',
  styleUrl: './bug-reporter-detail-dialog.component.scss'
})
export class BugReporterDetailDialogComponent implements OnInit {
  private readonly service = inject(BugReporterService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(
    MatDialogRef<BugReporterDetailDialogComponent>
  );

  readonly columns = ['id', 'method', 'status', 'url', 'duration', 'fecha', 'acciones'];

  requests: CapturedRequest[] = [];
  selectedId: number | null = null;
  draft: CapturedRequest | null = null;
  jsonText = '';
  jsonError: string | null = null;
  /** true = con saltos de línea (indent 2); false = compacto en una línea. */
  jsonExpanded = true;
  sections: JsonSectionItem[] = [];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const prev = this.selectedId;
    this.requests = this.service.getAll().slice().reverse();
    if (prev != null && this.requests.some((r) => r.id === prev)) {
      this.selectRequest(prev);
    } else if (this.requests.length) {
      this.selectRequest(this.requests[0].id);
    } else {
      this.selectedId = null;
      this.draft = null;
      this.jsonText = '';
      this.sections = [];
    }
  }

  selectRequest(id: number): void {
    const entry = this.service.getById(id);
    if (!entry) {
      return;
    }
    this.selectedId = id;
    this.draft = entry;
    this.jsonError = null;
    this.syncJsonFromDraft();
    this.rebuildSections();
  }

  shortUrl(url: string): string {
    try {
      const u = new URL(url, window.location.origin);
      return u.pathname + u.search;
    } catch {
      return url.length > 64 ? url.slice(0, 64) + '…' : url;
    }
  }

  statusClass(status: number): string {
    if (status >= 500) return 'st-5xx';
    if (status >= 400) return 'st-4xx';
    if (status >= 300) return 'st-3xx';
    if (status >= 200) return 'st-2xx';
    return 'st-0xx';
  }

  onJsonInput(): void {
    this.jsonError = null;
    try {
      const parsed = JSON.parse(this.jsonText) as CapturedRequest;
      if (parsed == null || typeof parsed !== 'object') {
        throw new Error('El JSON debe ser un objeto');
      }
      this.draft = {
        ...parsed,
        id: this.selectedId ?? parsed.id
      };
      this.rebuildSections();
    } catch (e) {
      this.jsonError =
        e instanceof Error ? e.message : 'JSON inválido';
    }
  }

  selectAllSections(selected: boolean): void {
    for (const s of this.sections) {
      s.selected = selected;
    }
  }

  get selectedSectionCount(): number {
    return this.sections.filter((s) => s.selected).length;
  }

  borrarSeccionesSeleccionadas(): void {
    if (!this.draft || !this.selectedId) {
      return;
    }
    const paths = this.sections.filter((s) => s.selected).map((s) => s.path);
    if (!paths.length) {
      this.snackBar.open('Seleccione al menos una sección', 'Cerrar', {
        duration: 2500
      });
      return;
    }
    // Borrar en draft local (padres primero al final para no invalidar hijos ya listados)
    const sorted = [...paths].sort((a, b) => b.split('.').length - a.split('.').length);
    const asRecord = this.draft as unknown as Record<string, unknown>;
    for (const path of sorted) {
      deletePathLocal(asRecord, path);
    }
    this.syncJsonFromDraft();
    this.rebuildSections();
    this.snackBar.open(
      `${paths.length} sección(es) quitada(s) del borrador. Guarde para aplicar.`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  /**
   * Guarda la petición en edición (si hay), compacta todos los JSON del
   * reporte, copia al portapapeles (sin saltos de línea) y cierra.
   */
  guardarCopiarYCerrar(): void {
    if (this.jsonError) {
      this.snackBar.open('Corrija el JSON antes de continuar', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    if (this.draft && this.selectedId != null) {
      try {
        const parsed = JSON.parse(this.jsonText) as CapturedRequest;
        this.service.replace(this.selectedId, {
          ...parsed,
          id: this.selectedId
        });
      } catch {
        this.snackBar.open('JSON inválido', 'Cerrar', { duration: 3000 });
        return;
      }
    }

    this.jsonExpanded = false;
    const text = this.service.exportJsonText(this.router.url);
    navigator.clipboard.writeText(text).then(
      () => this.dialogRef.close(true),
      () => {
        this.snackBar.open('No se pudo copiar al portapapeles', 'Cerrar', {
          duration: 3000
        });
        this.dialogRef.close(true);
      }
    );
  }

  eliminarPeticion(id: number, event?: Event): void {
    event?.stopPropagation();
    this.service.remove(id);
    this.reload();
    this.snackBar.open('Petición eliminada', undefined, { duration: 2000 });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  copiarJson(): void {
    if (!this.jsonText) {
      return;
    }
    navigator.clipboard.writeText(this.jsonText).then(
      () =>
        this.snackBar.open('JSON copiado', undefined, { duration: 2000 }),
      () =>
        this.snackBar.open('No se pudo copiar', 'Cerrar', { duration: 3000 })
    );
  }

  alternarFormatoJson(): void {
    const source = this.resolveJsonObject();
    if (source == null) {
      this.snackBar.open(
        'JSON inválido: no se puede colapsar/expandir',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }
    this.jsonExpanded = !this.jsonExpanded;
    this.draft = { ...source, id: this.selectedId ?? source.id };
    this.jsonError = null;
    this.syncJsonFromDraft();
  }

  private resolveJsonObject(): CapturedRequest | null {
    if (this.draft && !this.jsonError) {
      try {
        return JSON.parse(this.jsonText) as CapturedRequest;
      } catch {
        /* usar draft */
      }
      return this.draft;
    }
    try {
      return JSON.parse(this.jsonText) as CapturedRequest;
    } catch {
      return null;
    }
  }

  private syncJsonFromDraft(): void {
    if (!this.draft) {
      this.jsonText = '';
      return;
    }
    this.jsonText = this.jsonExpanded
      ? JSON.stringify(this.draft, null, 2)
      : JSON.stringify(this.draft);
  }

  private rebuildSections(): void {
    if (!this.draft) {
      this.sections = [];
      return;
    }
    const items: JsonSectionItem[] = [];
    const root = this.draft as unknown as Record<string, unknown>;

    for (const meta of EDITABLE_ROOT_SECTIONS) {
      if (!(meta.path in root) || root[meta.path] === undefined) {
        continue;
      }
      items.push({
        path: meta.path,
        label: meta.label,
        depth: 0,
        selected: false
      });
      const value = root[meta.path];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const key of Object.keys(value as object).sort()) {
          items.push({
            path: `${meta.path}.${key}`,
            label: key,
            depth: 1,
            selected: false
          });
        }
      }
    }
    this.sections = items;
  }
}

function deletePathLocal(root: Record<string, unknown>, path: string): void {
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
