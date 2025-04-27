import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrimeNgRoutingModule } from './prime-ng-routing.module';
import { PrimeNgComponent } from './prime-ng.component';


@NgModule({
  declarations: [
    PrimeNgComponent
  ],
  imports: [
    CommonModule,
    PrimeNgRoutingModule
  ]
})
export class PrimeNgModule { }
