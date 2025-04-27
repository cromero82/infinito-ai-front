import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChartApexComponent } from './chart-apex.component';

const routes: Routes = [{ path: '', component: ChartApexComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChartApexRoutingModule { }
