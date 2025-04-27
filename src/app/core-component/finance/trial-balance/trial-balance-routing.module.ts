import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrialBalanceComponent } from './trial-balance.component';

const routes: Routes = [{ path: '', component: TrialBalanceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrialBalanceRoutingModule { }
