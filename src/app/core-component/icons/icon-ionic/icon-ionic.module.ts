import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconIonicRoutingModule } from './icon-ionic-routing.module';
import { IconIonicComponent } from './icon-ionic.component';


@NgModule({
  declarations: [
    IconIonicComponent
  ],
  imports: [
    CommonModule,
    IconIonicRoutingModule
  ]
})
export class IconIonicModule { }
