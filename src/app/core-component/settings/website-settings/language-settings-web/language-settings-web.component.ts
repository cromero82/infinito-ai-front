import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-language-settings-web',
    templateUrl: './language-settings-web.component.html',
    styleUrl: './language-settings-web.component.scss',
    standalone: false
})
export class LanguageSettingsWebComponent {
  public routes = routes;
}
