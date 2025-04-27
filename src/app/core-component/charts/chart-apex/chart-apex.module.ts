import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChartApexRoutingModule } from './chart-apex-routing.module';
import { ChartApexComponent } from './chart-apex.component';
import { NgApexchartsModule } from 'ng-apexcharts';


@NgModule({
  declarations: [
    ChartApexComponent
  ],
  imports: [
    CommonModule,
    ChartApexRoutingModule,
    NgApexchartsModule
  ]
})
export class ChartApexModule { }
