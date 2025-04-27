import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';
interface data {
  value: string;
}

@Component({
    selector: 'app-invoice-settings',
    templateUrl: './invoice-settings.component.html',
    styleUrl: './invoice-settings.component.scss',
    standalone: false
})
export class InvoiceSettingsComponent {
  public selectedValue1 = '';
  public selectedValue2 = '';
  selectedList1: data[] = [{ value: '5' }, { value: '6' },{ value: '7' }];
  selectedList2: data[] = [{ value: 'Round Off Up' }];
  constructor(private sidebar: SidebarService) {}
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
