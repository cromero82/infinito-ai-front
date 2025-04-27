import { Component, Renderer2 } from '@angular/core';
import { Event as RouterEvent, NavigationStart, Router } from '@angular/router';
import { SettingsService } from '../core/core.index';
import { url } from '../shared/model/sidebar.model';

@Component({
    selector: 'app-error-pages',
    templateUrl: './error-pages.component.html',
    styleUrl: './error-pages.component.scss',
    standalone: false
})
export class ErrorPagesComponent {
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
    // this.settings.themeMode.subscribe((mode) => {
    //   this.themeMode = mode;
    // });
    // this.settings.themeMode.subscribe((res: string) => {
    //   if (res == 'dark_mode') {
    //     this.renderer.addClass(document.body, 'dark-select');
    //   } else {
    //     this.renderer.removeClass(document.body, 'dark-select');
    //   }
    // });
    this.getRoutes(this.Router);
  }

  private getRoutes(data: url): void {
    const splitVal = data.url.split('/');
    this.base = splitVal[1];
    this.page = splitVal[2];
    this.last = splitVal[3];
  } 
}
