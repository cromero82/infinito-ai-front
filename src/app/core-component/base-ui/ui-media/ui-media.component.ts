import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-media',
    templateUrl: './ui-media.component.html',
    styleUrl: './ui-media.component.scss',
    standalone: false
})
export class UiMediaComponent {
  public routes = routes;
}
