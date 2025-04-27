import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MoneyTransferRoutingModule } from './money-transfer-routing.module';
import { MoneyTransferComponent } from './money-transfer.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    MoneyTransferComponent
  ],
  imports: [
    CommonModule,
    MoneyTransferRoutingModule,
    sharedModule
  ]
})
export class MoneyTransferModule { }
