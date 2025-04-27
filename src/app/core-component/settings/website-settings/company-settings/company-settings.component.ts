import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';

@Component({
    selector: 'app-company-settings',
    templateUrl: './company-settings.component.html',
    styleUrl: './company-settings.component.scss',
    standalone: false
})
export class CompanySettingsComponent {
  constructor(private sidebar: SidebarService) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  public filter = false;
  openFilter() {
    this.filter = !this.filter;
  }
}
