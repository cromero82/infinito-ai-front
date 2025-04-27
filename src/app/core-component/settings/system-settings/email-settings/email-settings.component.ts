import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';

@Component({
    selector: 'app-email-settings',
    templateUrl: './email-settings.component.html',
    styleUrl: './email-settings.component.scss',
    standalone: false
})
export class EmailSettingsComponent {
  constructor(private sidebar: SidebarService) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
