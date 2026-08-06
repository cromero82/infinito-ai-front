import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { BugReporterService } from './bug-reporter.service';
import { BugReporterDialogAttachService } from './bug-reporter-dialog-attach.service';
import { openBugReporterDetail } from './bug-reporter-open.util';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'vex-bug-reporter-button',
  templateUrl: './bug-reporter-button.component.html',
  styleUrls: ['./bug-reporter-button.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    AsyncPipe
  ]
})
export class BugReporterButtonComponent implements OnInit {
  private readonly service = inject(BugReporterService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly dialogAttach = inject(BugReporterDialogAttachService);

  count$: Observable<number>;

  constructor() {
    this.count$ = new Observable<number>((observer) => {
      const emit = () => observer.next(this.service.count());
      emit();
      const id = setInterval(emit, 1000);
      return () => clearInterval(id);
    });
  }

  ngOnInit(): void {
    this.dialogAttach.start();
  }

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
