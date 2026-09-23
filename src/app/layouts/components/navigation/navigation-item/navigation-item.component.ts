import { Component, Input, OnInit } from '@angular/core';
import {
  NavigationItem,
  NavigationLink
} from '../../../../core/navigation/navigation-item.interface';
import { filter, map, startWith } from 'rxjs/operators';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NavigationService } from '../../../../core/navigation/navigation.service';
import { trackByRoute } from '@vex/utils/track-by';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'vex-navigation-item',
  templateUrl: './navigation-item.component.html',
  styleUrls: ['./navigation-item.component.scss'],
  imports: [
    MatRippleModule,
    NgClass,
    RouterLink,
    MatMenuModule,
    MatIconModule,
    NgTemplateOutlet,
    AsyncPipe
  ]
})
export class NavigationItemComponent implements OnInit {
  @Input({ required: true }) item!: NavigationItem;

  isActive$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => (item: NavigationItem) => this.hasActiveChilds(item))
  );

  isLink = this.navigationService.isLink;
  isDropdown = this.navigationService.isDropdown;
  isSubheading = this.navigationService.isSubheading;
  trackByRoute = trackByRoute;

  constructor(
    private navigationService: NavigationService,
    private router: Router
  ) {}

  ngOnInit() {}

  private isRouteActive(
    route: string,
    link?: NavigationLink
  ): boolean {
    const exact = link?.routerLinkActiveOptions?.exact !== false;
    return this.router.isActive(route, exact);
  }

  hasActiveChilds(parent: NavigationItem): boolean {
    if (this.isLink(parent)) {
      return this.isRouteActive(parent.route as string, parent);
    }

    if (this.isDropdown(parent) || this.isSubheading(parent)) {
      return parent.children.some((child) => {
        if (this.isDropdown(child)) {
          return this.hasActiveChilds(child);
        }

        if (this.isLink(child) && !this.isFunction(child.route)) {
          return this.isRouteActive(child.route as string, child);
        }

        return false;
      });
    }

    return false;
  }

  isFunction(prop: NavigationLink['route']) {
    return prop instanceof Function;
  }
}
