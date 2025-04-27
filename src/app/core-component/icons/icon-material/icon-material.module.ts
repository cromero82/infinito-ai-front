import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconMaterialRoutingModule } from './icon-material-routing.module';
import { IconMaterialComponent } from './icon-material.component';


@NgModule({
  declarations: [
    IconMaterialComponent
  ],
  imports: [
    CommonModule,
    IconMaterialRoutingModule
  ]
})
export class IconMaterialModule { }
