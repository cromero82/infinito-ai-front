import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';

@Component({
    selector: 'app-otp-settings',
    templateUrl: './otp-settings.component.html',
    styleUrl: './otp-settings.component.scss',
    standalone: false
})
export class OtpSettingsComponent {
  selectedValue1 = '';
  selectedValue2 = '';
  selectedValue3 = '';
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }

  constructor(private sidebar: SidebarService) {}
}
