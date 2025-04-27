import { ChangeDetectionStrategy, Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-stickynote',
    templateUrl: './ui-stickynote.component.html',
    styleUrl: './ui-stickynote.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class UiStickynoteComponent {
  notes = [];
  public routes = routes;
}
