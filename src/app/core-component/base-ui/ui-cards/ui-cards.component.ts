import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-cards',
    templateUrl: './ui-cards.component.html',
    styleUrl: './ui-cards.component.scss',
    standalone: false
})
export class UiCardsComponent {
  public routes = routes;
  isCardFullscreen = false;

  toggleFullscreen() {
    this.isCardFullscreen = !this.isCardFullscreen;
  }
  isCardVisible = true;

  toggleCardVisibility() {
    this.isCardVisible = !this.isCardVisible;
  }
}
