import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconTablerRoutingModule } from './icon-tabler-routing.module';
import { IconTablerComponent } from './icon-tabler.component';


@NgModule({
  declarations: [
    IconTablerComponent
  ],
  imports: [
    CommonModule,
    IconTablerRoutingModule
  ]
})
export class IconTablerModule { }
