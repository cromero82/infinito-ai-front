import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-email-verification-3',
    templateUrl: './email-verification-3.component.html',
    styleUrl: './email-verification-3.component.scss',
    standalone: false
})
export class EmailVerification3Component {
  public routes = routes;
  value : any
      constructor(private router: Router) {}
    
      navigation() {
        this.router.navigate([routes.resetPassword3])
      }
}
