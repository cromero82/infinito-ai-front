import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalesRoutingModule } from './sales-routing.module';
import { SalesComponent } from './sales.component';
import { SalesReturnsComponent } from './sales-returns/sales-returns.component';
import { QuotationListComponent } from './quotation-list/quotation-list.component';
import { PosComponent } from './pos/pos.component';
import { SalesListComponent } from './sales-list/sales-list.component';
import { sharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [
    SalesComponent,
    SalesReturnsComponent,
    QuotationListComponent,
    PosComponent,
    SalesListComponent,
    SalesListComponent
  ],
  imports: [
    CommonModule,
    SalesRoutingModule,
    sharedModule
  ]
})
export class SalesModule { }
