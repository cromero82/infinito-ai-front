import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiscountPlanComponent } from './discount-plan.component';

const routes: Routes = [{ path: '', component: DiscountPlanComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiscountPlanRoutingModule { }
