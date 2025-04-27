import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';

@Component({
    selector: 'app-storage-settings',
    templateUrl: './storage-settings.component.html',
    styleUrl: './storage-settings.component.scss',
    standalone: false
})
export class StorageSettingsComponent {
  constructor( private sidebar: SidebarService){
    
  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
