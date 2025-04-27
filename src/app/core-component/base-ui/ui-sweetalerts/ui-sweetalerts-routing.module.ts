import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiSweetalertsComponent } from './ui-sweetalerts.component';

const routes: Routes = [{ path: '', component: UiSweetalertsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiSweetalertsRoutingModule { }
