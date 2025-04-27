import { Component } from '@angular/core';
import { SidebarService, routes } from 'src/app/core/core.index';

@Component({
    selector: 'app-notification',
    templateUrl: './notification.component.html',
    styleUrl: './notification.component.scss',
    standalone: false
})
export class NotificationComponent {
  public routes = routes;

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  constructor(private sidebar: SidebarService) {}
}
