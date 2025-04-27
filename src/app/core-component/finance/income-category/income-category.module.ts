import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IncomeCategoryRoutingModule } from './income-category-routing.module';
import { IncomeCategoryComponent } from './income-category.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    IncomeCategoryComponent
  ],
  imports: [
    CommonModule,
    IncomeCategoryRoutingModule,
    sharedModule
  ]
})
export class IncomeCategoryModule { }
