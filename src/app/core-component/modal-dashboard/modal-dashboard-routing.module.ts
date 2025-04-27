import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModalDashboardComponent } from './modal-dashboard.component';

const routes: Routes = [{ path: '', component: ModalDashboardComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModalDashboardRoutingModule { }
