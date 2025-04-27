import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchaseTransactionRoutingModule } from './purchase-transaction-routing.module';
import { PurchaseTransactionComponent } from './purchase-transaction.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    PurchaseTransactionComponent
  ],
  imports: [
    CommonModule,
    PurchaseTransactionRoutingModule,
    sharedModule
  ]
})
export class PurchaseTransactionModule { }
