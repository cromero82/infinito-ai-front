import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsComponent } from './forms.component';
import { FormBasicInputsComponent } from './form-elements/form-basic-inputs/form-basic-inputs.component';
import { FormCheckboxRadiosComponent } from './form-elements/form-checkbox-radios/form-checkbox-radios.component';
import { FormElementsComponent } from './form-elements/form-elements/form-elements.component';
import { FormFileuploadComponent } from './form-elements/form-fileupload/form-fileupload.component';
import { FormGridGuttersComponent } from './form-elements/form-grid-gutters/form-grid-gutters.component';
import { FormInputGroupsComponent } from './form-elements/form-input-groups/form-input-groups.component';
import { FormMaskComponent } from './form-elements/form-mask/form-mask.component';
import { FormSelectComponent } from './form-elements/form-select/form-select.component';
import { FormSelect2Component } from './form-select-2/form-select-2.component';
import { FormValidationComponent } from './form-validation/form-validation.component';
import { FormWizardComponent } from './form-wizard/form-wizard.component';
import { FormFloatingLabelsComponent } from './layouts/form-floating-labels/form-floating-labels.component';
import { FormHorizontalComponent } from './layouts/form-horizontal/form-horizontal.component';
import { FormVerticalComponent } from './layouts/form-vertical/form-vertical.component';

const routes: Routes = [
  {
    path: '',
    component: FormsComponent,
    children: [
      {
        path: 'form-basic-inputs',
        component: FormBasicInputsComponent,
      },
      {
        path: 'form-checkbox-radios',
        component: FormCheckboxRadiosComponent,
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
      },
      {
        path: 'form-fileupload',
        component: FormFileuploadComponent,
      },
      {
        path: 'form-grid-gutters',
        component: FormGridGuttersComponent,
      },
      {
        path: 'form-input-groups',
        component: FormInputGroupsComponent,
      },
      {
        path: 'form-mask',
        component: FormMaskComponent,
      },
      {
        path: 'form-select',
        component: FormSelectComponent,
      },
      {
        path: 'form-select-2',
        component: FormSelect2Component,
      },
      {
        path: 'form-validation',
        component: FormValidationComponent,
      },
      {
        path: 'form-wizard',
        component: FormWizardComponent,
      },
      {
        path: 'form-floating-labels',
        component: FormFloatingLabelsComponent,
      },
      {
        path: 'form-horizontal',
        component: FormHorizontalComponent,
      },
      {
        path: 'form-vertical',
        component: FormVerticalComponent,
      },
      {
        path: 'form-pickers',
        loadChildren: () =>
          import('./form-pickers/form-pickers.module').then(
            (m) => m.FormPickersModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormsRoutingModule {}
