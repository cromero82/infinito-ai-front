import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import {
  AlertaEgresoSinVincularDto,
  GestionNotificacionesMediosService
} from './gestion-notificaciones-medios.service';

const POLL_MS = 8000;

@Injectable({ providedIn: 'root' })
export class AlertaEgresoSinVincularService implements OnDestroy {
  private readonly itemsSubject = new BehaviorSubject<AlertaEgresoSinVincularDto[]>([]);
  readonly items$ = this.itemsSubject.asObservable();
  private pollSub?: Subscription;
  private pollers = 0;

  constructor(private api: GestionNotificacionesMediosService) {}

  get items(): AlertaEgresoSinVincularDto[] {
    return this.itemsSubject.value;
  }

  get count(): number {
    return this.itemsSubject.value.length;
  }

  startPolling(): void {
    this.pollers++;
    if (this.pollSub) {
      return;
    }
    this.pollSub = interval(POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.api.alertasEgresoSinVincular().pipe(
            catchError(() => of({ count: 0, items: [] as AlertaEgresoSinVincularDto[] }))
          )
        )
      )
      .subscribe((res) => {
        this.itemsSubject.next(res?.items ?? []);
      });
  }

  stopPolling(): void {
    this.pollers = Math.max(0, this.pollers - 1);
    if (this.pollers > 0) {
      return;
    }
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  refresh(): Observable<AlertaEgresoSinVincularDto[]> {
    return new Observable((observer) => {
      this.api.alertasEgresoSinVincular().subscribe({
        next: (res) => {
          const items = res?.items ?? [];
          this.itemsSubject.next(items);
          observer.next(items);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
