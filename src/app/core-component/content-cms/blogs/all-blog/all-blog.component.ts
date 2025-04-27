
import { Component } from '@angular/core';
import { routes, SidebarService } from 'src/app/core/core.index';

@Component({
  selector: 'app-all-blog',
  standalone: false,
  
  templateUrl: './all-blog.component.html',
  styleUrl: './all-blog.component.scss'
})
export class AllBlogComponent {
  routes=routes

  tags = ['PointOfSale', 'RetailTech', 'POSIntegration'];

  constructor(
    private sidebar: SidebarService
  ){}
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }

}
