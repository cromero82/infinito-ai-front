import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { CommonService, DataService, routes, SidebarService } from 'src/app/core/core.index';
import { SideBar, SideBarMenu } from 'src/app/shared/model/page.model';

@Component({
    selector: 'app-sidebar-two',
    templateUrl: './sidebar-two.component.html',
    styleUrls: ['./sidebar-two.component.scss'],
    standalone: false
})
export class SidebarTwoComponent implements OnDestroy , OnInit {
  public routes = routes;
  showSubMenusTab = false;
  openMenuItem: any = null;
  activeMenu:any =  'Layouts';
  openSubmenuOneItem: any = null;
  base = 'dashboard';
  page = '';
  last = '';

  sidebardata2: SideBarMenu[] = [];
  constructor(
    public router: Router,
    private data: DataService,
    private sideBar: SidebarService,
    private common: CommonService
  ) {
    this.common.base.subscribe((res: string) => {
      this.base = res;
      if(this.base === 'layout-two-column') this.activeMenu = 'Layouts' ;
      this.sidebardata2.map((mainMenus: SideBarMenu) => {
        if (this.activeMenu === mainMenus.menuValue) {
          mainMenus.showMyTab = true;
        } else {
          mainMenus.showMyTab = false;
        }
      });
    });
    this.common.page.subscribe((res: string) => {
      this.page = res;
    });
    this.common.page.subscribe((res: string) => {
      this.last = res;
    });

    router.events.subscribe((event: object) => {
      if (event instanceof NavigationEnd) {
        const splitVal = event.url.split('/');
        this.base = splitVal[1];
        this.page = splitVal[2];
      }
    });
    // get sidebar data as observable because data is controlled for design to expand submenus
    this.sideBar.getSideBarData2.subscribe((res: SideBar[]) => {
      res.map((data: SideBar) => {
        data.menu.map((menus: SideBarMenu) => {
          this.sidebardata2.push(menus);
          menus.showMyTab = false;
        });
        // this.side_bar_data[0].showMyTab = true;
      });
    });


  }

  public showTabs(mainTittle: SideBarMenu): void {
    sessionStorage.setItem('menuValue2', mainTittle.menuValue);
    this.sidebardata2.map((mainMenus: SideBarMenu) => {
      if (mainTittle.menuValue === mainMenus.menuValue) {
        mainMenus.showMyTab = true;
      } else {
        mainMenus.showMyTab = false;
      }
    });
  }

  ngOnInit(): void {
    this.activeMenu = sessionStorage.getItem('menuValue2')
       this.sidebardata2.map((mainMenus: SideBarMenu) => {
            if (this.activeMenu === mainMenus.menuValue) {
              mainMenus.showMyTab = true;
            } else {
              mainMenus.showMyTab = false;
            }
          });

  }
  ngOnDestroy(): void {
    this.sideBar.resetData2();
  }
  miniSideBarBlur(position: string) {
    if (position === 'over') {
      this.sideBar.expandSideBar.next(true);
    } else {
      this.sideBar.expandSideBar.next(false);
    }
  }

  miniSideBarFocus(position: string) {
    if (position === 'over') {
      this.sideBar.expandSideBar.next(true);
    } else {
      this.sideBar.expandSideBar.next(false);
    }
  }
  public submenus = false;
  openSubmenus() {
    this.submenus = !this.submenus;
  }

  openMenu(menu: any): void {
    if (this.openMenuItem === menu) {
      this.openMenuItem = null;
    } else {
      this.openMenuItem = menu;
    }
  }
  openSubmenuOne(subMenus: any): void {
    if (this.openSubmenuOneItem === subMenus) {
      this.openSubmenuOneItem = null;
    } else {
      this.openSubmenuOneItem = subMenus;
    }
  }
}
