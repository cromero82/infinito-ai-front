import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-tooltips',
    templateUrl: './ui-tooltips.component.html',
    styleUrl: './ui-tooltips.component.scss',
    standalone: false
})
export class UiTooltipsComponent {
  public routes = routes;
  html = `<em>Tooltip</em> <u>with</u> <b>HTML</b>`;
  content = 'Disabled tooltip';

  primary = `<p class="btn-primary">Primary Tooltip</p>`;
  secondary = `<div class="btn-secondary">Secondary Tooltip</div>`;
  warning = `<div>Warning Tooltip</div>`;
  info = `<div>Info Tooltip</div>`;
  success = `<div class="btn-success">Success Tooltip</div>`;
  danger = `<div class="btn-danger">Danger Tooltip</div>`;
  light = `<div class="btn-light">Light Tooltip</div>`;
  dark = `<div class="btn-dark">Dark Tooltip</div>`;

  icon1 = `Marina Kai`;
  icon2 = `Alex Carey`;
  icon3 = `Maria John`;

  link = `Link Tooltip`
}
