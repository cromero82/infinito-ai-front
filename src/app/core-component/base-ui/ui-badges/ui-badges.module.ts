import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiBadgesRoutingModule } from './ui-badges-routing.module';
import { UiBadgesComponent } from './ui-badges.component';


@NgModule({
  declarations: [
    UiBadgesComponent
  ],
  imports: [
    CommonModule,
    UiBadgesRoutingModule
  ]
})
export class UiBadgesModule { }
