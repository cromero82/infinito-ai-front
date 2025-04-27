import { Component } from '@angular/core';
import { routes } from 'src/app/core/core.index';

@Component({
    selector: 'app-success-2',
    templateUrl: './success-2.component.html',
    styleUrl: './success-2.component.scss',
    standalone: false
})
export class Success2Component {
  public routes = routes

}
