import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BugReporterInDialogComponent } from './bug-reporter-in-dialog.component';

/**
 * Inyecta el botón Bug a la izquierda de las acciones de cada MatDialog.
 * Así el debug queda dentro del panel (usable con el backdrop gris).
 */
@Injectable({ providedIn: 'root' })
export class BugReporterDialogAttachService {
  private readonly dialog = inject(MatDialog);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.dialog.afterOpened.subscribe((ref) => {
      this.attachWhenReady(ref, 0);
    });
  }

  private attachWhenReady(
    dialogRef: MatDialogRef<unknown>,
    attempt: number
  ): void {
    // Evitar Monitor dentro del propio modal de detalle del Monitor.
    if (
      document.querySelector(
        `.cdk-overlay-pane.bug-reporter-detail-dialog #${CSS.escape(dialogRef.id)}`
      )
    ) {
      return;
    }

    const root = this.findDialogRoot(dialogRef.id);
    if (!root) {
      if (attempt < 12) {
        setTimeout(() => this.attachWhenReady(dialogRef, attempt + 1), 40);
      }
      return;
    }
    if (root.querySelector('vex-bug-reporter-in-dialog')) {
      return;
    }

    const actions = this.findOrCreateActions(root);
    if (!actions) {
      return;
    }

    const compRef = createComponent(BugReporterInDialogComponent, {
      environmentInjector: this.envInjector
    });
    actions.insertBefore(compRef.location.nativeElement, actions.firstChild);
    this.appRef.attachView(compRef.hostView);
    compRef.changeDetectorRef.detectChanges();

    dialogRef.afterClosed().subscribe(() => {
      this.appRef.detachView(compRef.hostView);
      compRef.destroy();
    });
  }

  private findDialogRoot(id: string): HTMLElement | null {
    return (
      document.getElementById(id) ||
      (document.querySelector(
        `mat-mdc-dialog-container#${CSS.escape(id)}, mat-dialog-container#${CSS.escape(id)}`
      ) as HTMLElement | null)
    );
  }

  private findOrCreateActions(root: HTMLElement): HTMLElement | null {
    const existing = root.querySelector(
      'mat-dialog-actions, [mat-dialog-actions], .mat-mdc-dialog-actions, .dialog-actions'
    ) as HTMLElement | null;
    if (existing) {
      return existing;
    }

    const host =
      (root.querySelector('.mat-mdc-dialog-component-host') as HTMLElement | null) ||
      (root.querySelector('.mdc-dialog__content') as HTMLElement | null)?.parentElement ||
      root;

    const actions = document.createElement('div');
    actions.setAttribute('mat-dialog-actions', '');
    actions.className =
      'mat-mdc-dialog-actions bug-reporter-dialog-actions-fallback';
    host.appendChild(actions);
    return actions;
  }
}
