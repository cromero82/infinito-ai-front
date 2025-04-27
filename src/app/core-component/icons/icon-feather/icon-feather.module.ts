import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconFeatherRoutingModule } from './icon-feather-routing.module';
import { IconFeatherComponent } from './icon-feather.component';


@NgModule({
  declarations: [
    IconFeatherComponent
  ],
  imports: [
    CommonModule,
    IconFeatherRoutingModule
  ]
})
export class IconFeatherModule { }
