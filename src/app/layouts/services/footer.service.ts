import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FooterItemDto } from '../components/footer/footer.component';

@Injectable({
  providedIn: 'root'
})
export class FooterService {
  private readonly footerItems$ = new BehaviorSubject<FooterItemDto[]>([]);

  get items$(): Observable<FooterItemDto[]> {
    return this.footerItems$.asObservable();
  }

  setFooterItems(items: FooterItemDto[]): void {
    this.footerItems$.next(items ?? []);
  }

  clearFooterItems(): void {
    this.footerItems$.next([]);
  }
}
