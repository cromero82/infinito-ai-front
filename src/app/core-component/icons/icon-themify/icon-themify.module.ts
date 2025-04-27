import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconThemifyRoutingModule } from './icon-themify-routing.module';
import { IconThemifyComponent } from './icon-themify.component';


@NgModule({
  declarations: [
    IconThemifyComponent
  ],
  imports: [
    CommonModule,
    IconThemifyRoutingModule
  ]
})
export class IconThemifyModule { }
