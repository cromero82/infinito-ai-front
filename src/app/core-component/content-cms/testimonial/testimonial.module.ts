import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestimonialRoutingModule } from './testimonial-routing.module';
import { TestimonialComponent } from './testimonial.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    TestimonialComponent
  ],
  imports: [
    CommonModule,
    TestimonialRoutingModule,
    sharedModule
  ]
})
export class TestimonialModule { }
