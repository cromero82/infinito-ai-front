import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiscountRoutingModule } from './discount-routing.module';
import { DiscountComponent } from './discount.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    DiscountComponent
  ],
  imports: [
    CommonModule,
    DiscountRoutingModule,
    sharedModule
  ]
})
export class DiscountModule { }
