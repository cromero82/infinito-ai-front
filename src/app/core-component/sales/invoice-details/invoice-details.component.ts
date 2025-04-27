import { Component } from '@angular/core';
import { routes, SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-invoice-details',
  standalone: false,
  
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent {
routes=routes;
isCollapsed: boolean = false;
constructor(private sidebar:SidebarService){}
toggleCollapse() {
  this.sidebar.toggleCollapse();
  this.isCollapsed = !this.isCollapsed;
}
}
