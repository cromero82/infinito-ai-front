import { Component } from '@angular/core';
import { routes, SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-product-quantity-alert',
  standalone:false,
  templateUrl: './product-quantity-alert.component.html',
  styleUrl: './product-quantity-alert.component.scss'
})
export class ProductQuantityAlertComponent {
routes=routes
constructor(private sidebar:SidebarService){}
isCollapsed: boolean = false;
toggleCollapse() {
  this.sidebar.toggleCollapse();
  this.isCollapsed = !this.isCollapsed;
}
}
