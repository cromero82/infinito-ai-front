import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoryRoutingModule } from './category-routing.module';
import { CategoryComponent } from './category.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { CategoryListComponent } from './category-list/category-list.component';
import { SubCategoriesComponent } from './sub-categories/sub-categories.component';


@NgModule({
  declarations: [
    CategoryComponent,
    CategoryListComponent,
    SubCategoriesComponent
  ],
  imports: [
    CommonModule,
    CategoryRoutingModule,
    sharedModule
  ]
})
export class CategoryModule { }
