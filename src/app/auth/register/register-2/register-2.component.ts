import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/core.index';

@Component({
    selector: 'app-register-2',
    templateUrl: './register-2.component.html',
    styleUrl: './register-2.component.scss',
    standalone: false
})
export class Register2Component {
  public routes = routes;
  public password : boolean[] = [false];

  public togglePassword(index: number){
    this.password[index] = !this.password[index]
  }
  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.signIn2])
  }
}
