import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-two-step-verification-2',
    templateUrl: './two-step-verification-2.component.html',
    styleUrl: './two-step-verification-2.component.scss',
    standalone: false
})
export class TwoStepVerification2Component {
  public routes = routes;
  value:any;
  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.resetPassword2])
  }
}
