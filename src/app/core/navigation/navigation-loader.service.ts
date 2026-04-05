import { Injectable } from '@angular/core';
import { VexLayoutService } from '@vex/services/vex-layout.service';
import { NavigationItem } from './navigation-item.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationLoaderService {
  private readonly _items: BehaviorSubject<NavigationItem[]> =
    new BehaviorSubject<NavigationItem[]>([]);

  get items$(): Observable<NavigationItem[]> {
    return this._items.asObservable();
  }

  constructor(private readonly layoutService: VexLayoutService) {
    this.loadNavigation();
  }

  loadNavigation(): void {
    this._items.next([
      {
        type: 'link',
        label: 'Ventas',
        route: '/apps/ventas',
            icon: 'mat:assignment'
      },
      {
        type: 'link',
        label: 'Productos',
        route: '/apps/products/admin-productos',
        icon: 'mat:shopping_cart'
      },
      {
        type: 'link',
        label: 'Historial Ventas',
        route: '/apps/ventas/historial',
        icon: 'mat:history'
      },
      {
        type: 'link',
        label: 'Financiero',
        route: '/apps/financiero',
        icon: 'mat:dashboard'
      },
    ]);
  }
}
