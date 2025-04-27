import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-form-grid-gutters',
    templateUrl: './form-grid-gutters.component.html',
    styleUrl: './form-grid-gutters.component.scss',
    standalone: false
})
export class FormGridGuttersComponent {
  public routes = routes;
}
