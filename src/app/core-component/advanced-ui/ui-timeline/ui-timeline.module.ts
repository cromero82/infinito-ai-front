import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiTimelineRoutingModule } from './ui-timeline-routing.module';
import { UiTimelineComponent } from './ui-timeline.component';


@NgModule({
  declarations: [
    UiTimelineComponent
  ],
  imports: [
    CommonModule,
    UiTimelineRoutingModule
  ]
})
export class UiTimelineModule { }
