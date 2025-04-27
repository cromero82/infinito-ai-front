import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-invoice-template',
  standalone: false,
  
  templateUrl: './invoice-template.component.html',
  styleUrl: './invoice-template.component.scss'
})
export class InvoiceTemplateComponent {
 constructor(private sidebar: SidebarService) {}
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
