import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService, routes } from 'src/app/core/core.index';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    standalone: false
})
export class ProfileComponent {
  public routes = routes;
  constructor(private sidebar: SidebarService, private router: Router) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  navigation() {
    this.router.navigate([routes.generalSettings])
  }
}
