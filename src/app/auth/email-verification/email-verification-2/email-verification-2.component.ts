import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-email-verification-2',
    templateUrl: './email-verification-2.component.html',
    styleUrl: './email-verification-2.component.scss',
    standalone: false
})
export class EmailVerification2Component {
  public routes = routes;
  value : any
      constructor(private router: Router) {}
    
      navigation() {
        this.router.navigate([routes.resetPassword2])
      }
}
