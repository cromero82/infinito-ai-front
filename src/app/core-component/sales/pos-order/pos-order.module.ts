import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PosOrderRoutingModule } from './pos-order-routing.module';
import { PosOrderComponent } from './pos-order.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    PosOrderComponent
  ],
  imports: [
    CommonModule,
    PosOrderRoutingModule,
    sharedModule
  ]
})
export class PosOrderModule { }
