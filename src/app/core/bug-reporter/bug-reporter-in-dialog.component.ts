import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Observable } from 'rxjs';
import { BugReporterService } from './bug-reporter.service';
import { MONITOR_BUTTON_LABEL } from './bug-reporter.labels';
import { openBugReporterDetail } from './bug-reporter-open.util';

/**
 * Botón Monitor inyectado a la izquierda de mat-dialog-actions.
 * Queda dentro del panel del modal (por encima del backdrop gris).
 */
@Component({
  selector: 'vex-bug-reporter-in-dialog',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    AsyncPipe
  ],
  template: `
    <button
      type="button"
      mat-stroked-button
      color="primary"
      class="bug-in-dialog-btn"
      [matBadge]="count$ | async"
      matBadgeColor="warn"
      matBadgeSize="small"
      matBadgeOverlap="false"
      [matMenuTriggerFor]="menu"
      aria-label="Monitor">
      <mat-icon svgIcon="mat:monitor"></mat-icon>
      <span>{{ label }}</span>
    </button>
    <mat-menu #menu="matMenu">
      <button mat-menu-item type="button" (click)="verDetalle()">
        <mat-icon svgIcon="mat:table_chart"></mat-icon>
        <span>Ver detalle</span>
      </button>
      <button mat-menu-item type="button" (click)="copiarAlPortapapeles()">
        <mat-icon svgIcon="mat:content_copy"></mat-icon>
        <span>Copiar al portapapeles</span>
      </button>
      <button mat-menu-item type="button" (click)="limpiar()">
        <mat-icon svgIcon="mat:delete_sweep"></mat-icon>
        <span>Limpiar</span>
      </button>
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        margin-right: auto;
        order: -1;
      }

      .bug-in-dialog-btn {
        min-width: 0;
        padding: 0 12px;
        line-height: 32px;
      }

      .bug-in-dialog-btn mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `
  ]
})
export class BugReporterInDialogComponent {
  private readonly service = inject(BugReporterService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly label = MONITOR_BUTTON_LABEL;

  readonly count$: Observable<number> = new Observable<number>((observer) => {
    const emit = () => observer.next(this.service.count());
    emit();
    const id = setInterval(emit, 1000);
    return () => clearInterval(id);
  });

  verDetalle(): void {
    openBugReporterDetail(this.dialog);
  }

  copiarAlPortapapeles(): void {
    const report = this.service.exportJson(this.router.url);
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
  }

  limpiar(): void {
    this.service.clear();
  }
}
