import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-images',
    templateUrl: './ui-images.component.html',
    styleUrl: './ui-images.component.scss',
    standalone: false
})
export class UiImagesComponent {
  public routes = routes;
}
