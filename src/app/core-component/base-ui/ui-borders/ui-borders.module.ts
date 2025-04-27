import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiBordersRoutingModule } from './ui-borders-routing.module';
import { UiBordersComponent } from './ui-borders.component';


@NgModule({
  declarations: [
    UiBordersComponent
  ],
  imports: [
    CommonModule,
    UiBordersRoutingModule
  ]
})
export class UiBordersModule { }
