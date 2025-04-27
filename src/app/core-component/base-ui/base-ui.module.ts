import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BaseUiRoutingModule } from './base-ui-routing.module';
import { BaseUiComponent } from './base-ui.component';


@NgModule({
  declarations: [
    BaseUiComponent
  ],
  imports: [
    CommonModule,
    BaseUiRoutingModule
  ]
})
export class BaseUiModule { }
