import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconFontawesomeRoutingModule } from './icon-fontawesome-routing.module';
import { IconFontawesomeComponent } from './icon-fontawesome.component';


@NgModule({
  declarations: [
    IconFontawesomeComponent
  ],
  imports: [
    CommonModule,
    IconFontawesomeRoutingModule
  ]
})
export class IconFontawesomeModule { }
