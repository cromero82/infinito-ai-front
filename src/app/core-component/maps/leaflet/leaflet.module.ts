import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeafletRoutingModule } from './leaflet-routing.module';
import { LeafletComponent } from './leaflet.component';


@NgModule({
  declarations: [
    LeafletComponent
  ],
  imports: [
    CommonModule,
    LeafletRoutingModule
  ]
})
export class LeafletModule { }
