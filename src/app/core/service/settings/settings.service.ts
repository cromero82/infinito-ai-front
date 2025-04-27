import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CommonService } from '../common/common.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {

  private renderer: Renderer2;
  base = '';
  page = '';
  last = '';
  // Layout Mode
  public layoutMode: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('layoutMode') || 'default'
  );

  // Layout Width
  public layoutWidth: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('layoutWidth') || 'fluid'
  );

  // Sidebar Color
  public sidebarColor: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('sidebarColor') || 'light'
  );
  public sidebarColor2: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('sidebarColor2') || '1'
  );
    // Theme Color
    public themeColor: BehaviorSubject<string> = new BehaviorSubject<string>(
      localStorage.getItem('themeColor') || 'light'
    );

  // Topbar Color
  public topbarColor: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('topbarColor') || 'white'
  );
  public topbarColor2: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('topbarColor2') || '1'
  );
  public topbarColor3: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('topbarColor3') || '1'
  );

  public topbarColor4: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('topbarColor4') || '1'
  );
  public primaryColor: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('primaryColor') || '1'
  );
  public primaryColor1: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('primaryColor1') || '1'
  );

  public sidebarImage: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('sidebarImage') || ''
  );




  constructor(rendererFactory: RendererFactory2,private common: CommonService) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.common.base.subscribe((res: string) => {
      this.base = res;
    });
    this.common.page.subscribe((res: string) => {
      this.page = res;
    });
    this.common.last.subscribe((res: string) => {
      this.last = res;
    });
  }





  public changeLayoutMode(layout: string): void {
    this.layoutMode.next(layout);
    localStorage.setItem('layoutMode', layout);
    this.renderer.setAttribute(
      document.documentElement,
      'data-layout', layout 
    );

    if (layout === 'rtl') {
      this.renderer.addClass(document.body, 'layout-mode-rtl');
    } else {
      this.renderer.removeClass(document.body, 'layout-mode-rtl');
    }

  }
  public changeLayoutWidth(width: string): void {
    this.layoutWidth.next(width);
    localStorage.setItem('layoutWidth', width);
    this.renderer.setAttribute(
      document.documentElement,
      'data-width', width 
    );

  }

  public changeSidebarColor(sidebarColor: string): void {
    this.sidebarColor.next(sidebarColor);
    localStorage.setItem('sidebarColor', sidebarColor);
    this.renderer.setAttribute(
      document.documentElement,
      'data-sidebar',
      sidebarColor 
    );
  }
  public changeThemeColor(themeColor: string): void {
    this.themeColor.next(themeColor);
    localStorage.setItem('themeColor', themeColor);
    this.renderer.setAttribute(
      document.documentElement,
      'data-theme',
      themeColor
    );
  }

  public changeTopbarColor(topbar: string): void {
    this.topbarColor.next(topbar);
    localStorage.setItem('topbarColor', topbar);
    this.renderer.setAttribute(
      document.documentElement,
      'data-topbar',
      topbar
    );
  }
  public changeTopbarColor2(topbar: string): void {
    this.topbarColor2.next(topbar);
    localStorage.setItem('topbarColor2', topbar);
    this.renderer.setAttribute(
      document.documentElement,
      'data-topbarcolor',
      topbar === '1'
        ? 'white'
        : topbar === '2'
        ? 'primary': topbar === '3'
        ? 'blackpearl': topbar === '4'
        ? 'maroon': topbar === '5'
        ? 'bluegem': topbar === '6'
        ? 'firefly':'all'
    );
  }
  public changePrimaryColor(color: string): void {
    this.primaryColor.next(color);
    localStorage.setItem('primaryColor', color);
    this.renderer.setAttribute(
      document.documentElement,
      'data-color',
      color 
    );
  }

  public changeSidebarImage(img: string): void {
    this.sidebarImage.next(img);
    localStorage.setItem('sidebarImage', img);
    this.renderer.setAttribute(
      document.body,
      'data-sidebarbg',
      img
    );
  }

  public changeSidebarColor2(color: string): void {
    this.sidebarColor2.next(color);
    localStorage.setItem('sidebarColor2', color);

  }
  public changeTopbarColor3(color: string): void {
    this.topbarColor3.next(color);
    localStorage.setItem('topbarColor3', color);

  }
  public changeTopbarHorizontalColor(color: string): void {
    this.topbarColor4.next(color);
    localStorage.setItem('topbarColor4', color);

  }
  public changePrimaryColor1(color: string): void {
    this.primaryColor1.next(color);
    localStorage.setItem('primaryColor1', color);

  }
}

