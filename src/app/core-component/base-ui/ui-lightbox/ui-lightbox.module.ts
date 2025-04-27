import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiLightboxRoutingModule } from './ui-lightbox-routing.module';
import { UiLightboxComponent } from './ui-lightbox.component';


@NgModule({
  declarations: [
    UiLightboxComponent
  ],
  imports: [
    CommonModule,
    UiLightboxRoutingModule
  ]
})
export class UiLightboxModule { }
