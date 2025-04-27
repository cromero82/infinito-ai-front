import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiRatingRoutingModule } from './ui-rating-routing.module';
import { UiRatingComponent } from './ui-rating.component';
import { RatingModule } from 'ngx-bootstrap/rating';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    UiRatingComponent
  ],
  imports: [
    CommonModule,
    UiRatingRoutingModule,
    RatingModule,
    FormsModule
   
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UiRatingModule { }
