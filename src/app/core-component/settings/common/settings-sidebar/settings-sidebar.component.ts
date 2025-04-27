import { Component, ChangeDetectionStrategy, Renderer2  } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';
import { CommonService } from 'src/app/core/service/common/common.service';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';
interface MenuItem {
  icon: string;
  title: string;
  page: string;
  subMenu: { title: string; routes: string;last?:string }[];
  expanded?: boolean; 
}
@Component({
    selector: 'app-settings-sidebar',
    templateUrl: './settings-sidebar.component.html',
    styleUrl: './settings-sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SettingsSidebarComponent {
  public routes = routes;
  base = '';
  page = '';
  last = '';
  active = ''
constructor(private common: CommonService, private setting: SidebarService,private renderer: Renderer2){
  this.common.base.subscribe((base: string) => {
    this.base = base;
  });
  this.common.page.subscribe((page: string) => {
    this.page = page;
    this.active = page;
    
  });
  this.common.last.subscribe((last: string) => {
    this.last = last;
  });
  this.menuItems = this.setting.settings_sidebar;
  localStorage.setItem('ss',  this.active);
  this.openSubDrop2()
}


public menuItems: Array<MenuItem> = [];
toggleSubMenu(menu: any) {
  // Close all submenus except the clicked one
  this.menuItems.forEach((item) => {
    // let settingsArray: string[] = [];
    // settingsArray.push(item.page);
    // let act = item.page
    // console.log(item,22);
    
    if (item !== menu) {
      item.expanded = false; // Collapse all others
    }
  });

  // Toggle only the clicked menu
  menu.expanded = !menu.expanded;
}
openSubDrop(page:string) {
  localStorage.setItem('ss', page);


}
openSubDrop2() {
  let gg = localStorage.getItem('ss');
  this.menuItems.forEach((item) => {
    if (item.page === gg) {
      item.expanded = true; // Collapse all others
    }
    

  });

}

}

