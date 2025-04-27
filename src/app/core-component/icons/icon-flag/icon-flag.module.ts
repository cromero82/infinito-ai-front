import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconFlagRoutingModule } from './icon-flag-routing.module';
import { IconFlagComponent } from './icon-flag.component';


@NgModule({
  declarations: [
    IconFlagComponent
  ],
  imports: [
    CommonModule,
    IconFlagRoutingModule
  ]
})
export class IconFlagModule { }
