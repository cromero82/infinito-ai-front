import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-breadcrumb',
    templateUrl: './ui-breadcrumb.component.html',
    styleUrl: './ui-breadcrumb.component.scss',
    standalone: false
})
export class UiBreadcrumbComponent {
  public routes = routes;
}
