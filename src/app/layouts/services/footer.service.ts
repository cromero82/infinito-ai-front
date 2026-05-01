import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FooterItemDto } from '../components/footer/footer.component';

/** Flujo visual de los ítems en el pie: `ltr` (por defecto) o `rtl` (agrupación hacia la derecha). */
export type FooterItemsFlow = 'ltr' | 'rtl';

export interface SetFooterItemsOptions {
  itemsFlow?: FooterItemsFlow;
}

@Injectable({
  providedIn: 'root'
})
export class FooterService {
  private readonly footerItems$ = new BehaviorSubject<FooterItemDto[]>([]);
  private readonly itemsFlowSubject = new BehaviorSubject<FooterItemsFlow>(
    'ltr'
  );

  get items$(): Observable<FooterItemDto[]> {
    return this.footerItems$.asObservable();
  }

  get itemsFlow$(): Observable<FooterItemsFlow> {
    return this.itemsFlowSubject.asObservable();
  }

  setFooterItems(
    items: FooterItemDto[],
    options?: SetFooterItemsOptions
  ): void {
    const list = items ?? [];
    this.footerItems$.next(list);
    const flow: FooterItemsFlow =
      list.length > 0 ? (options?.itemsFlow ?? 'ltr') : 'ltr';
    this.itemsFlowSubject.next(flow);
  }

  clearFooterItems(): void {
    this.footerItems$.next([]);
    this.itemsFlowSubject.next('ltr');
  }
}
