import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiRibbonRoutingModule } from './ui-ribbon-routing.module';
import { UiRibbonComponent } from './ui-ribbon.component';


@NgModule({
  declarations: [
    UiRibbonComponent
  ],
  imports: [
    CommonModule,
    UiRibbonRoutingModule
  ]
})
export class UiRibbonModule { }
