import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';

@Component({
    selector: 'app-social-authentication',
    templateUrl: './social-authentication.component.html',
    styleUrl: './social-authentication.component.scss',
    standalone: false
})
export class SocialAuthenticationComponent {
  constructor( private sidebar: SidebarService){

  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
