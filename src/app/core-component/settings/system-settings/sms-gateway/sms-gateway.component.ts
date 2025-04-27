import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';

@Component({
    selector: 'app-sms-gateway',
    templateUrl: './sms-gateway.component.html',
    styleUrl: './sms-gateway.component.scss',
    standalone: false
})
export class SmsGatewayComponent {
  constructor( private sidebar: SidebarService){

  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
