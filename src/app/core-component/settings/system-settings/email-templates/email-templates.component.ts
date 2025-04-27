import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-email-templates',
  standalone: false,
  
  templateUrl: './email-templates.component.html',
  styleUrl: './email-templates.component.scss'
})
export class EmailTemplatesComponent {
  constructor(private sidebar: SidebarService) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
