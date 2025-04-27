import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BalanceSheetRoutingModule } from './balance-sheet-routing.module';
import { BalanceSheetComponent } from './balance-sheet.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    BalanceSheetComponent
  ],
  imports: [
    CommonModule,
    BalanceSheetRoutingModule,
    sharedModule
  ]
})
export class BalanceSheetModule { }
