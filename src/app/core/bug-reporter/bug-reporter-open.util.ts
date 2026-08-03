import { MatDialog } from '@angular/material/dialog';
import { BugReporterDetailDialogComponent } from './bug-reporter-detail-dialog.component';

/** Abre el modal de detalle del Monitor (tabla + editor JSON). */
export function openBugReporterDetail(dialog: MatDialog): void {
  dialog.open(BugReporterDetailDialogComponent, {
    width: '1320px', // 1100 + 20%
    maxWidth: '96vw',
    maxHeight: '92vh',
    autoFocus: false,
    panelClass: 'bug-reporter-detail-dialog'
  });
}
