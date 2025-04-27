import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiSpinnerRoutingModule } from './ui-spinner-routing.module';
import { UiSpinnerComponent } from './ui-spinner.component';


@NgModule({
  declarations: [
    UiSpinnerComponent
  ],
  imports: [
    CommonModule,
    UiSpinnerRoutingModule
  ]
})
export class UiSpinnerModule { }
