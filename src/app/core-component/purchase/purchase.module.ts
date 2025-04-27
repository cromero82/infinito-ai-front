import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchaseRoutingModule } from './purchase-routing.module';
import { PurchaseComponent } from './purchase.component';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { PurchaseOrderReportComponent } from './purchase-order-report/purchase-order-report.component';
import { PurchaseReturnsComponent } from './purchase-returns/purchase-returns.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    PurchaseComponent,
    PurchaseListComponent,
    PurchaseOrderReportComponent,
    PurchaseReturnsComponent
  ],
  imports: [
    CommonModule,
    PurchaseRoutingModule,
    sharedModule
  ]
})
export class PurchaseModule { }
