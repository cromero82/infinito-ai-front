import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-two-step-verification',
    templateUrl: './two-step-verification.component.html',
    styleUrl: './two-step-verification.component.scss',
    standalone: false
})
export class TwoStepVerificationComponent {
  public routes = routes;
  value:any;
  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.resetPassword])
  }
}
