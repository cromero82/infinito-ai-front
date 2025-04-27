import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-signatures',
  standalone: false,
  
  templateUrl: './signatures.component.html',
  styleUrl: './signatures.component.scss'
})
export class SignaturesComponent {
 constructor(private sidebar: SidebarService) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
