import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TabActionService {
  private openProductListTabSource = new Subject<void>();
  openProductListTab$ = this.openProductListTabSource.asObservable();

  triggerOpenProductListTab() {
    this.openProductListTabSource.next();
  }
}
