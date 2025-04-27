import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceDetailsRoutingModule } from './invoice-details-routing.module';
import { InvoiceDetailsComponent } from './invoice-details.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    InvoiceDetailsComponent
  ],
  imports: [
    CommonModule,
    InvoiceDetailsRoutingModule,
    sharedModule
  ]
})
export class InvoiceDetailsModule { }
