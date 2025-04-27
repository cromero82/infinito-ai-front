import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-email-verification',
    templateUrl: './email-verification.component.html',
    styleUrl: './email-verification.component.scss',
    standalone: false
})
export class EmailVerificationComponent {
  public routes = routes;
  value : any
    constructor(private router: Router) {}
  
    navigation() {
      this.router.navigate([routes.resetPassword])
    }
  
}
