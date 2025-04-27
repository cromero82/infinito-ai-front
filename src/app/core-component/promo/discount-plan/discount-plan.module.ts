import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountPlanRoutingModule } from './discount-plan-routing.module';
import { DiscountPlanComponent } from './discount-plan.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    DiscountPlanComponent
  ],
  imports: [
    CommonModule,
    DiscountPlanRoutingModule,
    sharedModule
  ]
})
export class DiscountPlanModule { }
