import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pos3RoutingModule } from './pos-3-routing.module';
import { Pos3Component } from './pos-3.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    Pos3Component
  ],
  imports: [
    CommonModule,
    Pos3RoutingModule,
    sharedModule
  ]
})
export class Pos3Module { }
