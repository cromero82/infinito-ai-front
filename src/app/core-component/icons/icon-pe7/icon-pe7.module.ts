import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconPe7RoutingModule } from './icon-pe7-routing.module';
import { IconPe7Component } from './icon-pe7.component';


@NgModule({
  declarations: [
    IconPe7Component
  ],
  imports: [
    CommonModule,
    IconPe7RoutingModule
  ]
})
export class IconPe7Module { }
