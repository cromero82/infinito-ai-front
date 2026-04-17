import { Component } from '@angular/core';
import { NavigationService } from '../../../core/navigation/navigation.service';
import { NavigationItemComponent } from './navigation-item/navigation-item.component';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { NavigationItem } from '../../../core/navigation/navigation-item.interface';

@Component({
  selector: 'vex-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  imports: [NavigationItemComponent, AsyncPipe]
})
export class NavigationComponent {
  items$: Observable<NavigationItem[]> = this.navigationService.items$;

  constructor(private navigationService: NavigationService) {}
}
