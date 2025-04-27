import { Component } from '@angular/core';
import { SpinnerService } from 'src/app/core/core.index';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
    standalone: false
})
export class LoaderComponent {

  constructor(public spinner: SpinnerService) {}

  loading$ = this.spinner.loading$;

 

}
