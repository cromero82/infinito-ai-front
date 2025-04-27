import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-accordion',
    templateUrl: './ui-accordion.component.html',
    styleUrl: './ui-accordion.component.scss',
    standalone: false
})
export class UiAccordionComponent {
  public routes = routes;
}
