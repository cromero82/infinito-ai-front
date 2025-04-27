import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiRangesliderComponent } from './ui-rangeslider.component';

const routes: Routes = [{ path: '', component: UiRangesliderComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiRangesliderRoutingModule { }
