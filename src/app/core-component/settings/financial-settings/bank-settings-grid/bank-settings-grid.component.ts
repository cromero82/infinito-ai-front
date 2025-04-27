import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-bank-settings-grid',
    templateUrl: './bank-settings-grid.component.html',
    styleUrl: './bank-settings-grid.component.scss',
    standalone: false
})
export class BankSettingsGridComponent {
  public routes = routes;
  isActive: string ='default'
  default=true;
  constructor(private sidebar: SidebarService) {}

  setActive(theme: string) {
    this.isActive = theme;
 
  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
