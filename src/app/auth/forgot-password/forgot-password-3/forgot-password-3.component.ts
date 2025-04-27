import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-forgot-password-3',
    templateUrl: './forgot-password-3.component.html',
    styleUrl: './forgot-password-3.component.scss',
    standalone: false
})
export class ForgotPassword3Component {
  public routes = routes;

  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.signIn3])
  }
}
