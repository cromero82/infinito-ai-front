import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdvancedUiRoutingModule } from './advanced-ui-routing.module';
import { AdvancedUiComponent } from './advanced-ui.component';


@NgModule({
  declarations: [
    AdvancedUiComponent
  ],
  imports: [
    CommonModule,
    AdvancedUiRoutingModule
  ]
})
export class AdvancedUiModule { }
