import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes, SidebarService } from 'src/app/core/core.index';

interface data {
  value: string;
}
@Component({
    selector: 'app-kanban-view',
    templateUrl: './kanban-view.component.html',
    styleUrl: './kanban-view.component.scss',
    standalone: false
})
export class KanbanViewComponent {
  routes = routes
  public selectedValue1 = '';
  constructor(
    private sidebar: SidebarService
  ){}
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  selectedList1: data[] = [
    { value: 'Sort by Date' },
    { value: 'Ascending' },
    { value: 'Decending' },
    { value: 'Recently Viewed' },
    { value: 'Recently Added' },
    { value: 'Creation Date' },
  ];
}
