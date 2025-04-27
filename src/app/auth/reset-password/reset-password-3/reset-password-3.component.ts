import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-reset-password-3',
    templateUrl: './reset-password-3.component.html',
    styleUrl: './reset-password-3.component.scss',
    standalone: false
})
export class ResetPassword3Component {
  public routes = routes;
  public password : boolean[] = [false];

  public togglePassword(index: number){
    this.password[index] = !this.password[index]
  }
  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.success3])
  }
}
