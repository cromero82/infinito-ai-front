import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiCounterRoutingModule } from './ui-counter-routing.module';
import { FormatTimePipe, UiCounterComponent } from './ui-counter.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    UiCounterComponent,
    FormatTimePipe
  ],
  imports: [
    CommonModule,
    UiCounterRoutingModule,
    FormsModule
  ]
})
export class UiCounterModule { }
