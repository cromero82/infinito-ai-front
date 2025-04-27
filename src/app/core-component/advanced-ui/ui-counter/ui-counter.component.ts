import { Component, OnDestroy, OnInit, Pipe, PipeTransform } from '@angular/core';
import { Subscription, interval, map, timer } from 'rxjs';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-counter',
    templateUrl: './ui-counter.component.html',
    styleUrl: './ui-counter.component.scss',
    standalone: false
})
export class UiCounterComponent implements OnInit, OnDestroy {
  public routes = routes;
  // counter
  counter = 1;
  maxValue = 300;
  timerSubscription: Subscription;
  counter1 = 1;
  maxValue1 = 1000;
  timerSubscription1: Subscription;
  counter2 = 1;
  maxValue2 = 1500;
  timerSubscription2: Subscription;
  countDown4: Subscription | undefined;
  counter4 = 180;
  tick4 = 1000;
  countDown5: Subscription | undefined;
  counter5 = 0;
  tick5 = 1000;
  countDown6: Subscription | undefined;
  counter6 = 30;
  tick6 = 1000;
  countDown7: Subscription | undefined;
  counter7 = 10;
  tick7 = 1000;

  constructor() {
    this.timerSubscription = interval(2)
      .pipe(map(() => this.increment()))
      .subscribe();

      this.timerSubscription1 = interval(2)
      .pipe(map(() => this.increment1()))
      .subscribe();

      this.timerSubscription2 = interval(2)
      .pipe(map(() => this.increment2()))
      .subscribe();
  }

  increment() {
    this.counter++;
    if (this.counter >= this.maxValue) {
      this.timerSubscription.unsubscribe();
    }
  }

  increment1() {
    this.counter1++;
    if (this.counter1 >= this.maxValue1) {
      this.timerSubscription1.unsubscribe();
    }
  }
  increment2() {
    this.counter2++;
    if (this.counter2 >= this.maxValue2) {
      this.timerSubscription2.unsubscribe();
    }
  }


  ngOnInit(): void {
    this.countDown4 = timer(0, this.tick4).subscribe((count) => {
      if (this.counter4 == 0 && count) {
        if (this.countDown4) {
          this.countDown4.unsubscribe();
        }
      }
      --this.counter4;
    });
    this.countDown5 = timer(0, this.tick5).subscribe((count) => {
      if (this.counter5 == 0 && count) {
        if (this.countDown5) {
          this.countDown5.unsubscribe();
        }
      }
      ++this.counter5;
    });
    this.countDown6 = timer(0, this.tick6).subscribe((count) => {
      if (this.counter6 == 0 && count) {
        if (this.countDown6) {
          this.countDown6.unsubscribe();
        }
      }
      --this.counter6;
    });
    this.countDown7 = timer(0, this.tick7).subscribe((count) => {
      if (this.counter7 == 0 && count) {
        if (this.countDown7) {
          this.countDown7.unsubscribe();
        }
      }
      --this.counter7;
    });
  }
  ngOnDestroy() {
    this.countDown4 = undefined;
    this.countDown5 = undefined;
    this.countDown6 = undefined;
    this.countDown7 = undefined;
  }
  countDownDate = new Date("Nov 27, 2022 10:25:20").getTime();
  demo !:string;
  x = setInterval(() => {
    const now = new Date().getTime();
    const distance = this.countDownDate - now;
    const days = Math.floor(distance / (1000*60*60*24));
    const hours = Math.floor((distance % (1000*60*60*24)) / (1000*60*60)); 
    const minutes = Math.floor((distance % (1000*60*60*60)) / (1000*60));
    const seconds = Math.floor((distance % (1000*60)) / (1000)); 
    this.demo = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
  })
}
@Pipe({
    name: 'formatTime',
    standalone: false
})
export class FormatTimePipe implements PipeTransform {
  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return (
      '00' +  ' ' +
      'Day' + ' ' +
      '00' +  ':' +
      ('00' + ''+ minutes).slice(-2) +
      ':' +
      ('00' + Math.floor(value - minutes * 60)).slice(-2)
    );
  }
  transform1(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return (
      '00' +  ' ' +
      'Day' + ' ' +
      ('00' + ''+ minutes).slice(-2) +
      ':' +
      ('00' + Math.floor(value - minutes * 60)).slice(-2)
    );
  }
  transform2(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return (
      '00' +  ' ' +
      'Day' + ' ' +
      ('00' + ''+ minutes).slice(-2) +
      ':' +
      ('00' + Math.floor(value - minutes * 60)).slice(-2)
    );
  }
  transform3(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return (
      '00' +  ' ' +
      'Day' + ' ' +
      '00' +  ':' +
      ('00' + ''+ minutes).slice(-2) +
      ':' +
      ('00' + Math.floor(value - minutes * 60)).slice(-2)
    );
  }

}
