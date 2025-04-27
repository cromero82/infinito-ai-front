import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlacesRoutingModule } from './places-routing.module';
import { PlacesComponent } from './places.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { CountriesComponent } from './countries/countries.component';
import { StatesComponent } from './states/states.component';


@NgModule({
  declarations: [
    PlacesComponent,
    CountriesComponent,
    StatesComponent
  ],
  imports: [
    CommonModule,
    PlacesRoutingModule,
    sharedModule
  ]
})
export class PlacesModule { }
