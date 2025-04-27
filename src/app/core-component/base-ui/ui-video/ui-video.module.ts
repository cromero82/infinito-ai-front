import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiVideoRoutingModule } from './ui-video-routing.module';
import { UiVideoComponent } from './ui-video.component';


@NgModule({
  declarations: [
    UiVideoComponent
  ],
  imports: [
    CommonModule,
    UiVideoRoutingModule
  ]
})
export class UiVideoModule { }
