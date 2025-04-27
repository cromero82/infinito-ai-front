import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconTypiconRoutingModule } from './icon-typicon-routing.module';
import { IconTypiconComponent } from './icon-typicon.component';


@NgModule({
  declarations: [
    IconTypiconComponent
  ],
  imports: [
    CommonModule,
    IconTypiconRoutingModule
  ]
})
export class IconTypiconModule { }
