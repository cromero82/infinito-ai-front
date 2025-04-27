import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'app-coming-soon',
    templateUrl: './coming-soon.component.html',
    styleUrl: './coming-soon.component.scss',
    standalone: false
})
export class ComingSoonComponent implements OnInit, OnDestroy {
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;
  countdownExpired: boolean = false;
  email: string = '';

  private countdownInterval: ReturnType<typeof setInterval> | undefined;

  ngOnInit() {
    this.setCountdown();
  }

  
  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  setCountdown() {
    const countdownDate = new Date('Dec 27, 2025 16:00:00').getTime();

    this.countdownInterval = setInterval(() => {
      const todayDate = new Date().getTime();
      const distance = countdownDate - todayDate;

      this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (distance < 0) {
        clearInterval(this.countdownInterval);
        this.countdownExpired = true;
      }
    }, 1000);
  }
 
}
