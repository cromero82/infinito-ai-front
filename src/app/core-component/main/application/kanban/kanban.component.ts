import { Component } from '@angular/core';
import { routes } from 'src/app/core/core.index';


@Component({
    selector: 'app-kanban',
    templateUrl: './kanban.component.html',
    styleUrl: './kanban.component.scss',
    standalone: false
})
export class KanbanComponent {
  public routes = routes;
}
