import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminDashboard1RoutingModule } from './admin-dashboard-1-routing.module';
import { AdminDashboard1Component } from './admin-dashboard-1.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    AdminDashboard1Component
  ],
  imports: [
    CommonModule,
    AdminDashboard1RoutingModule,
    sharedModule
  ]
})
export class AdminDashboard1Module { }
