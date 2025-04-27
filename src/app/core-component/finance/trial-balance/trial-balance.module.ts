import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrialBalanceRoutingModule } from './trial-balance-routing.module';
import { TrialBalanceComponent } from './trial-balance.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    TrialBalanceComponent
  ],
  imports: [
    CommonModule,
    TrialBalanceRoutingModule,
    sharedModule
  ]
})
export class TrialBalanceModule { }
