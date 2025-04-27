import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiDropdownsRoutingModule } from './ui-dropdowns-routing.module';
import { UiDropdownsComponent } from './ui-dropdowns.component';


@NgModule({
  declarations: [
    UiDropdownsComponent
  ],
  imports: [
    CommonModule,
    UiDropdownsRoutingModule
  ]
})
export class UiDropdownsModule { }
