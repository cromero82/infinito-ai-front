import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';
interface data {
  value: string;
}

@Component({
    selector: 'app-gdpr-settings',
    templateUrl: './gdpr-settings.component.html',
    styleUrl: './gdpr-settings.component.scss',
    standalone: false
})
export class GdprSettingsComponent {
  constructor(private sidebar: SidebarService) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  public selectedValue1 = '';
  selectedList1: data[] = [
    { value: 'Left' },
    { value: 'Center' },
    { value: 'Right' },
  ];
}
