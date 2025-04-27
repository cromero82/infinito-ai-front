import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsRoutingModule } from './forms-routing.module';
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
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    FormsComponent,
    FormBasicInputsComponent,
    FormCheckboxRadiosComponent,
    FormElementsComponent,
    FormFileuploadComponent,
    FormGridGuttersComponent,
    FormInputGroupsComponent,
    FormMaskComponent,
    FormSelectComponent,
    FormSelect2Component,
    FormValidationComponent,
    FormWizardComponent,
    FormFloatingLabelsComponent,
    FormHorizontalComponent,
    FormVerticalComponent,
  ],
  imports: [
    CommonModule,
    FormsRoutingModule,
    sharedModule
  ]
})
export class FormsModule { }