import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconWeatherRoutingModule } from './icon-weather-routing.module';
import { IconWeatherComponent } from './icon-weather.component';


@NgModule({
  declarations: [
    IconWeatherComponent
  ],
  imports: [
    CommonModule,
    IconWeatherRoutingModule
  ]
})
export class IconWeatherModule { }
