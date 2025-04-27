import { Component, Renderer2 } from '@angular/core';
import { NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { SettingsService } from '../core/core.index';
import { url } from '../shared/model/sidebar.model';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    standalone: false
})
export class AuthComponent {
  public themeMode: string = '';
  base = '';
  page = '';
  last = '';

  constructor(
    private Router: Router,
    private settings: SettingsService,
    private renderer: Renderer2
  ) {
    this.Router.events.subscribe((data: RouterEvent) => {
      if (data instanceof NavigationStart) {
        this.getRoutes(data);
      }
    });
    this.settings.themeColor.subscribe((mode) => {
      this.themeMode = mode;
    });
    this.settings.themeColor.subscribe((res: string) => {
      if (res == 'dark_mode') {
        this.renderer.addClass(document.body, 'dark-select');
      } else {
        this.renderer.removeClass(document.body, 'dark-select');
      }
    });
    this.getRoutes(this.Router);
  }

  private getRoutes(data: url): void {
    const splitVal = data.url.split('/');
    this.base = splitVal[1];
    this.page = splitVal[2];
    this.last = splitVal[3];
  } 
}
