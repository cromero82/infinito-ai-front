import { Component } from '@angular/core';
import { routes, SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-product-report',
  standalone:false,
  templateUrl: './product-report.component.html',
  styleUrl: './product-report.component.scss'
})
export class ProductReportComponent {
routes=routes
constructor(private sidebar:SidebarService){}
isCollapsed: boolean = false;
toggleCollapse() {
  this.sidebar.toggleCollapse();
  this.isCollapsed = !this.isCollapsed;
}
}
