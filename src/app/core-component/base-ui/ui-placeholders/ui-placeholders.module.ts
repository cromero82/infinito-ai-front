import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiPlaceholdersRoutingModule } from './ui-placeholders-routing.module';
import { UiPlaceholdersComponent } from './ui-placeholders.component';


@NgModule({
  declarations: [
    UiPlaceholdersComponent
  ],
  imports: [
    CommonModule,
    UiPlaceholdersRoutingModule
  ]
})
export class UiPlaceholdersModule { }
