import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiRangesliderRoutingModule } from './ui-rangeslider-routing.module';
import { UiRangesliderComponent } from './ui-rangeslider.component';
import { sharedModule } from 'src/app/shared/shared.module';
import {MatSliderModule} from '@angular/material/slider';


@NgModule({
  declarations: [
    UiRangesliderComponent
  ],
  imports: [
    CommonModule,
    UiRangesliderRoutingModule,
    sharedModule,
    MatSliderModule
  ]
})
export class UiRangesliderModule { }
