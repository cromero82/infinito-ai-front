import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';
interface data {
  value: string;
}
@Component({
    selector: 'app-pos-settings',
    templateUrl: './pos-settings.component.html',
    styleUrl: './pos-settings.component.scss',
    standalone: false
})
export class PosSettingsComponent {
  public selectedValue1 = '';
  selectedList1: data[] = [
    { value: 'A4' },
    { value: 'A4' },
    { value: 'A4' },
  ];
  constructor(private sidebar: SidebarService) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }

}
