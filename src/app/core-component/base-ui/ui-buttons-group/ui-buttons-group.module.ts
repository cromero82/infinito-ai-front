import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiButtonsGroupRoutingModule } from './ui-buttons-group-routing.module';
import { UiButtonsGroupComponent } from './ui-buttons-group.component';


@NgModule({
  declarations: [
    UiButtonsGroupComponent
  ],
  imports: [
    CommonModule,
    UiButtonsGroupRoutingModule
  ]
})
export class UiButtonsGroupModule { }
