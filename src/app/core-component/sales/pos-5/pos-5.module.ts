import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pos5RoutingModule } from './pos-5-routing.module';
import { Pos5Component } from './pos-5.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    Pos5Component
  ],
  imports: [
    CommonModule,
    Pos5RoutingModule,
    sharedModule
  ]
})
export class Pos5Module { }
