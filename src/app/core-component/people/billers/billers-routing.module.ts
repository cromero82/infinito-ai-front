import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillersComponent } from './billers.component';

const routes: Routes = [{ path: '', component: BillersComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillersRoutingModule { }
