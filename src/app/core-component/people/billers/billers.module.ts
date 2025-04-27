import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BillersRoutingModule } from './billers-routing.module';
import { BillersComponent } from './billers.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    BillersComponent
  ],
  imports: [
    CommonModule,
    BillersRoutingModule,
    sharedModule
  ]
})
export class BillersModule { }
