import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StockRoutingModule } from './stock-routing.module';
import { StockComponent } from './stock.component';
import { LowStocksComponent } from './low-stocks/low-stocks.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    StockComponent,
    LowStocksComponent
  ],
  imports: [
    CommonModule,
    StockRoutingModule,
    sharedModule
  ]
})
export class StockModule { }
