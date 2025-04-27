import { Component, ViewEncapsulation } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-form-wizard',
    templateUrl: './form-wizard.component.html',
    styleUrl: './form-wizard.component.scss',
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class FormWizardComponent {
  public routes = routes;
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });

  constructor(private _formBuilder: FormBuilder) {}
}
