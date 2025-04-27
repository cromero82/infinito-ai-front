import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiColorsRoutingModule } from './ui-colors-routing.module';
import { UiColorsComponent } from './ui-colors.component';


@NgModule({
  declarations: [
    UiColorsComponent
  ],
  imports: [
    CommonModule,
    UiColorsRoutingModule
  ]
})
export class UiColorsModule { }
