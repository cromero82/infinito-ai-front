import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiRatingComponent } from './ui-rating.component';

const routes: Routes = [{ path: '', component: UiRatingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiRatingRoutingModule { }
