import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pos4RoutingModule } from './pos-4-routing.module';
import { Pos4Component } from './pos-4.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    Pos4Component
  ],
  imports: [
    CommonModule,
    Pos4RoutingModule,
    sharedModule
  ]
})
export class Pos4Module { }
