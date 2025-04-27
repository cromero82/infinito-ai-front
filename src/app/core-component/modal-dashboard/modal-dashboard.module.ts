import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalDashboardRoutingModule } from './modal-dashboard-routing.module';
import { ModalDashboardComponent } from './modal-dashboard.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ModalDashboardComponent
  ],
  imports: [
    CommonModule,
    ModalDashboardRoutingModule,
    sharedModule
  ]
})
export class ModalDashboardModule { }
