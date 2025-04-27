import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-payslip',
    templateUrl: './payslip.component.html',
    styleUrl: './payslip.component.scss',
    standalone: false
})
export class PayslipComponent {
  public routes = routes;
  isCollapsed: boolean = false;
  constructor(private sidebar :SidebarService){}
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
