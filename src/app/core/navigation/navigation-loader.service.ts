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
        label: 'Tickets',
        route: '/apps/tickets',
            icon: 'mat:assignment'
      },
      {
        type: 'link',
        label: 'Productos',
        route: '/apps/productos/admin-productos',
        icon: 'mat:shopping_cart'
      },
      {
        type: 'link',
        label: 'Historial Tickets',
        route: '/apps/tickets/historial',
        icon: 'mat:history'
      },
      {
        type: 'link',
        label: 'Financiero',
        route: '/apps/financiero',
        icon: 'mat:dashboard',
        routerLinkActiveOptions: { exact: false },
        shortcuts: [
          {
            label: 'Crear Egreso',
            route: '/apps/financiero/egresos',
            queryParams: { nuevo: '1' },
            icon: 'mat:money_off'
          },
          {
            label: 'Orígenes de fondos',
            route: '/apps/financiero/origenes-fondos',
            icon: 'mat:account_balance_wallet'
          },
          {
            label: 'Cuentas por cobrar',
            route: '/apps/financiero/cuentas-por-cobrar',
            icon: 'mat:request_quote'
          }
        ]
      },
    ]);
  }
}
