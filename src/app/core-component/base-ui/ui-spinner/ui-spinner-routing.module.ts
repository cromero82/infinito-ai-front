import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiSpinnerComponent } from './ui-spinner.component';

const routes: Routes = [{ path: '', component: UiSpinnerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiSpinnerRoutingModule { }
