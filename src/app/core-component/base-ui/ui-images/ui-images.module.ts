import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiImagesRoutingModule } from './ui-images-routing.module';
import { UiImagesComponent } from './ui-images.component';


@NgModule({
  declarations: [
    UiImagesComponent
  ],
  imports: [
    CommonModule,
    UiImagesRoutingModule
  ]
})
export class UiImagesModule { }
