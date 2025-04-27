import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiProgressRoutingModule } from './ui-progress-routing.module';
import { UiProgressComponent } from './ui-progress.component';


@NgModule({
  declarations: [
    UiProgressComponent
  ],
  imports: [
    CommonModule,
    UiProgressRoutingModule
  ]
})
export class UiProgressModule { }
