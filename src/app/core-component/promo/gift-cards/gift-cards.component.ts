import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, SidebarService } from 'src/app/core/core.index';
import { PaginationService } from 'src/app/shared/shared.index';
import { SweetalertService } from 'src/app/shared/sweetalert/sweetalert.service';

@Component({
  selector: 'app-gift-cards',
  standalone: false,
  
  templateUrl: './gift-cards.component.html',
  styleUrl: './gift-cards.component.scss'
})
export class GiftCardsComponent {
  isCollapsed: boolean = false;
    constructor(
      private data: DataService,
      private pagination: PaginationService,
      private sweetalert: SweetalertService,
      private router: Router,
      private sidebar: SidebarService
    ) {}
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
}
