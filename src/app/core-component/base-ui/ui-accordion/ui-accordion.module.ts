import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiAccordionRoutingModule } from './ui-accordion-routing.module';
import { UiAccordionComponent } from './ui-accordion.component';


@NgModule({
  declarations: [
    UiAccordionComponent
  ],
  imports: [
    CommonModule,
    UiAccordionRoutingModule
  ]
})
export class UiAccordionModule { }
