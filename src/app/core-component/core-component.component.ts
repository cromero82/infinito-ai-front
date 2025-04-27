import { Component, OnInit, Renderer2 } from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  Event as RouterEvent,
} from '@angular/router';
import {
  CommonService,
  SettingsService,
  SidebarService,
} from '../core/core.index';
import { url } from '../shared/model/sidebar.model';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-core-component.',
    templateUrl: './core-component.component.html',
    styleUrls: ['./core-component.component.scss'],
    standalone: false
})
export class CoreComponentComponent implements OnInit {
  public miniSidebar = false;
  public expandMenu = false;
  public mobileSidebar = false;
  public sideBaractivePath = false;
  public themeMode: string = '';
  layoutMode = 'fluid';
  layoutWidth = 'fluid';
  public navigationColor: string = '';
  showPreloader = false;
  selectedColor = '84, 109, 254, 1';
  selectedColor1 = '555, 555, 555, 1';
  horizontalColor='555, 555, 555, 1';
  dthemeColor= '84, 109, 254, 1';
  showPreloaderState = '';
  base = '';
  page = '';
  last = '';
  public isLoader: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('isLoader') || '1'
  );
  constructor(
    private Router: Router,
    private settings: SettingsService,
    private sidebar: SidebarService,
    private common: CommonService,
    private renderer: Renderer2
  ) {
    this.sidebar.toggleMobileSideBar.subscribe((res: string) => {
      if (res == 'true' || res == 'true') {
        this.mobileSidebar = true;
      } else {
        this.mobileSidebar = false;
      }
    });
    this.sidebar.expandSideBar.subscribe((res: boolean) => {
      this.expandMenu = res;
    });
    this.Router.events.subscribe((data: RouterEvent) => {
      if (data instanceof NavigationStart) {
        this.getRoutes(data);
      }
      if (data instanceof NavigationEnd) {
        localStorage.removeItem('isMobileSidebar');
        this.mobileSidebar = false;
      }
      if (this.page === 'pos') {
        localStorage.removeItem('sideBarPosition');
      }
    });
    this.sidebar.sideBarPosition.subscribe((res: string) => {
      if (res == 'true' && this.page !== 'pos') {
        this.miniSidebar = true;
      } else {
        this.miniSidebar = false;
      }
    });
    this.isLoader.subscribe((res: string) => {
      this.showPreloaderState = res;
    });
    //Loader
    this.Router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Show loader when navigation starts
        this.showPreloader = true;
      } else if (event instanceof NavigationEnd) {
        // Hide loader after a delay
        setTimeout(() => {
          this.showPreloader = false;
        }, 2000);
      }
    });
    // this.settings.themeMode.subscribe((mode) => {
    //   this.themeMode = mode;
    // });
    this.settings.layoutMode.subscribe((layout) => {
      this.layoutMode = layout;
    });
    this.settings.layoutWidth.subscribe((layout) => {
      this.layoutWidth = layout;
    });
    this.settings.sidebarColor2.subscribe((res: string) => {
      this.selectedColor = res;
    });
    this.settings.topbarColor3.subscribe((res: string) => {
      this.selectedColor1 = res;
    });
    this.settings.topbarColor4.subscribe((res: string) => {
      this.horizontalColor = res;
    });
    this.settings.primaryColor1.subscribe((res: string) => {
      this.dthemeColor = res;
    });
    this.getRoutes(this.Router);
  }
  private getRoutes(data: url): void {
    const splitVal = data.url.split('/');
    this.base = splitVal[1];
    this.page = splitVal[2];
    this.last = splitVal[3];
    this.common.base.next(splitVal[1]);
    this.common.page.next(splitVal[2]);
    this.common.last.next(splitVal[3]);
    if (
      data.url.split('/')[1] === 'errorpages' ||
      data.url.split('/')[2] === 'pos' ||
      data.url.split('/')[2] === 'pos-2' ||
      data.url.split('/')[2] === 'pos-3' ||
      data.url.split('/')[2] === 'pos-4' ||
      data.url.split('/')[2] === 'pos-5' ||
      data.url.split('/')[1] === 'auth'
    ) {
      this.sideBaractivePath = true;
    } else {
      this.sideBaractivePath = false;
    }
    if (data.url.split('/')[2] === 'pos') {
      this.sideBaractivePath = true;
    }
    if (this.page === 'pos') {
      this.miniSidebar = false;
    }
  }

  isCollapsed: boolean = false;

  ngOnInit(): void {
    this.sidebar.collapse$.subscribe((collapse: boolean) => {
      this.isCollapsed = collapse;
    });
  }


  
}
