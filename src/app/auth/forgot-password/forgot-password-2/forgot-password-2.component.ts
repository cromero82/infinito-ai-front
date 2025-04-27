import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-forgot-password-2',
    templateUrl: './forgot-password-2.component.html',
    styleUrl: './forgot-password-2.component.scss',
    standalone: false
})
export class ForgotPassword2Component {
  public routes = routes;
  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.signIn2])
  }
}
