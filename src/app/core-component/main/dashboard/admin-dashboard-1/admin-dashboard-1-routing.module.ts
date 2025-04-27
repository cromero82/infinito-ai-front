import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboard1Component } from './admin-dashboard-1.component';

const routes: Routes = [{ path: '', component: AdminDashboard1Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminDashboard1RoutingModule { }
