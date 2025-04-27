import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiSweetalertsRoutingModule } from './ui-sweetalerts-routing.module';
import { UiSweetalertsComponent } from './ui-sweetalerts.component';


@NgModule({
  declarations: [
    UiSweetalertsComponent
   
  ],
  imports: [
    CommonModule,
    UiSweetalertsRoutingModule
  ]
})
export class UiSweetalertsModule { }
