import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceTemplateRoutingModule } from './invoice-template-routing.module';
import { InvoiceTemplateComponent } from './invoice-template.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    InvoiceTemplateComponent
  ],
  imports: [
    CommonModule,
    InvoiceTemplateRoutingModule,
    sharedModule
  ]
})
export class InvoiceTemplateModule { }
