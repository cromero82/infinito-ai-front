import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CashFlowRoutingModule } from './cash-flow-routing.module';
import { CashFlowComponent } from './cash-flow.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    CashFlowComponent
  ],
  imports: [
    CommonModule,
    CashFlowRoutingModule,
    sharedModule
  ]
})
export class CashFlowModule { }
