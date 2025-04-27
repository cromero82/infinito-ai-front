import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiCarouselRoutingModule } from './ui-carousel-routing.module';
import { UiCarouselComponent } from './ui-carousel.component';


@NgModule({
  declarations: [
    UiCarouselComponent
  ],
  imports: [
    CommonModule,
    UiCarouselRoutingModule
  ]
})
export class UiCarouselModule { }
