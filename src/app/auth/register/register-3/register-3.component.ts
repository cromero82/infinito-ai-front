import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-register-3',
    templateUrl: './register-3.component.html',
    styleUrl: './register-3.component.scss',
    standalone: false
})
export class Register3Component {
  public routes = routes;
 
  public password : boolean[] = [false];

  public togglePassword(index: number){
    this.password[index] = !this.password[index]

  }
  constructor(private router: Router) {}

  navigation() {
    this.router.navigate([routes.signIn3])
  }
  
}
