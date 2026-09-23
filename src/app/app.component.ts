import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FrontendMonitorLifecycleService } from './core/monitoring/frontend-monitor-lifecycle.service';

@Component({
    selector: 'vex-root',
    templateUrl: './app.component.html',
    imports: [RouterOutlet]
})
export class AppComponent {
  constructor() {
    inject(FrontendMonitorLifecycleService);
  }
}
