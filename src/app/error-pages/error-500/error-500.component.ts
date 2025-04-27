import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-error-500',
    templateUrl: './error-500.component.html',
    styleUrl: './error-500.component.scss',
    standalone: false
})
export class Error500Component {
  public routes = routes;
}
