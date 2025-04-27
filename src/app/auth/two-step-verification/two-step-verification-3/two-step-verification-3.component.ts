import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-two-step-verification-3',
    templateUrl: './two-step-verification-3.component.html',
    styleUrl: './two-step-verification-3.component.scss',
    standalone: false
})
export class TwoStepVerification3Component {
  public routes = routes;
  value:any;
  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.resetPassword3])
  }
}
