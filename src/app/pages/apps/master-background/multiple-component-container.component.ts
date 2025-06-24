import { Component, Type } from '@angular/core';
import { ProductListComponent } from '../products/product-list/product-list.component';
import { ContactsTableComponent } from '../contacts/contacts-table/contacts-table.component';
import { ProductEditComponent } from '../products/product-edit/product-edit.component';
import { NgIf, NgFor, NgComponentOutlet } from '@angular/common';

interface Tab {
  title: string;
  component: Type<any>;
  id: number;
}

@Component({
  selector: 'vex-multiple-component-container',
  standalone: true,
  templateUrl: './multiple-component-container.component.html',
  styleUrl: './multiple-component-container.component.scss',
  imports: [NgIf, NgFor, NgComponentOutlet, ProductListComponent, ContactsTableComponent, ProductEditComponent],
})
export class MultipleComponentContainerComponent {
  tabs: Tab[] = [];
  activeTabIndex = 0;
  private tabIdCounter = 0;

  openTab(title: string, component: Type<any>) {
    let uniqueTitle = title;
    let counter = 1;
    while (this.tabs.some(tab => tab.title === uniqueTitle)) {
      uniqueTitle = `${title} (${++counter})`;
    }
    this.tabs.push({ title: uniqueTitle, component, id: ++this.tabIdCounter });
    this.activeTabIndex = this.tabs.length - 1;
  }

  closeTab(index: number) {
    this.tabs.splice(index, 1);
    if (this.activeTabIndex >= this.tabs.length) {
      this.activeTabIndex = this.tabs.length - 1;
    }
  }

  openProductListTab() {
    this.openTab('Product List', ProductListComponent);
  }

  openContactsTableTab() {
    this.openTab('Contacts Table', ContactsTableComponent);
  }

  openProductEditTab() {
    this.openTab('Product Edit', ProductEditComponent);
  }

  trackByTabId(index: number, tab: Tab) {
    return tab.id;
  }
}