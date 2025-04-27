import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiMediaRoutingModule } from './ui-media-routing.module';
import { UiMediaComponent } from './ui-media.component';


@NgModule({
  declarations: [
    UiMediaComponent
  ],
  imports: [
    CommonModule,
    UiMediaRoutingModule
  ]
})
export class UiMediaModule { }
