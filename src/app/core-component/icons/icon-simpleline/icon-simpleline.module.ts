import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconSimplelineRoutingModule } from './icon-simpleline-routing.module';
import { IconSimplelineComponent } from './icon-simpleline.component';


@NgModule({
  declarations: [
    IconSimplelineComponent
  ],
  imports: [
    CommonModule,
    IconSimplelineRoutingModule
  ]
})
export class IconSimplelineModule { }
