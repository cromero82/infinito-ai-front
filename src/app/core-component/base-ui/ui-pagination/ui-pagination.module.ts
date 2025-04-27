import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiPaginationRoutingModule } from './ui-pagination-routing.module';
import { UiPaginationComponent } from './ui-pagination.component';


@NgModule({
  declarations: [
    UiPaginationComponent
  ],
  imports: [
    CommonModule,
    UiPaginationRoutingModule
  ]
})
export class UiPaginationModule { }
