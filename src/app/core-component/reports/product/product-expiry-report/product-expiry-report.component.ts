import { Component } from '@angular/core';
import { routes, SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-product-expiry-report',
  standalone:false,
  templateUrl: './product-expiry-report.component.html',
  styleUrl: './product-expiry-report.component.scss'
})
export class ProductExpiryReportComponent {
routes=routes
constructor(private sidebar:SidebarService){}
isCollapsed: boolean = false;
toggleCollapse() {
  this.sidebar.toggleCollapse();
  this.isCollapsed = !this.isCollapsed;
}
}
