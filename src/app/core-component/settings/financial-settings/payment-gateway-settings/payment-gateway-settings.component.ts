import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';

@Component({
    selector: 'app-payment-gateway-settings',
    templateUrl: './payment-gateway-settings.component.html',
    styleUrl: './payment-gateway-settings.component.scss',
    standalone: false
})
export class PaymentGatewaySettingsComponent {
  public routes = routes;
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }

  constructor(private sidebar: SidebarService) {}
}
