import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-sms-templates',
  standalone: false,
  
  templateUrl: './sms-templates.component.html',
  styleUrl: './sms-templates.component.scss'
})
export class SmsTemplatesComponent {
  constructor( private sidebar: SidebarService){

  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
}
}
