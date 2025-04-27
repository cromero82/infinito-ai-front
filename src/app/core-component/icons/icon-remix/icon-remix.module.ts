import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconRemixRoutingModule } from './icon-remix-routing.module';
import { IconRemixComponent } from './icon-remix.component';


@NgModule({
  declarations: [
    IconRemixComponent
  ],
  imports: [
    CommonModule,
    IconRemixRoutingModule
  ]
})
export class IconRemixModule { }
