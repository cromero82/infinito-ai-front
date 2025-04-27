import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StockRoutingModule } from './stock-routing.module';
import { StockComponent } from './stock.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { ManageStocksComponent } from './manage-stocks/manage-stocks.component';
import { StockTransferComponent } from './stock-transfer/stock-transfer.component';
import { StockAdjustmentComponent } from './stock-adjustment/stock-adjustment.component';


@NgModule({
  declarations: [
    StockComponent,
    ManageStocksComponent,
    StockTransferComponent,
    StockAdjustmentComponent
  ],
  imports: [
    CommonModule,
    StockRoutingModule,
    sharedModule
  ]
})
export class StockModule { }
