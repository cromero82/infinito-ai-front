import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pos2RoutingModule } from './pos-2-routing.module';
import { Pos2Component } from './pos-2.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    Pos2Component
  ],
  imports: [
    CommonModule,
    Pos2RoutingModule,
    sharedModule
  ]
})
export class Pos2Module { }
