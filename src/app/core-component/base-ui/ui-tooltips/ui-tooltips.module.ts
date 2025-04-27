import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiTooltipsRoutingModule } from './ui-tooltips-routing.module';
import { UiTooltipsComponent } from './ui-tooltips.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UiTooltipsComponent
  ],
  imports: [
    CommonModule,
    UiTooltipsRoutingModule,
    sharedModule
  ]
})
export class UiTooltipsModule { }
