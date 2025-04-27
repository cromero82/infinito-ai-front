import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExpenseRoutingModule } from './expense-routing.module';
import { ExpenseComponent } from './expense.component';
import { ExpenseCategoryComponent } from './expense-category/expense-category.component';
import { ExpenseListComponent } from './expense-list/expense-list.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ExpenseComponent,
    ExpenseCategoryComponent,
    ExpenseListComponent
  ],
  imports: [
    CommonModule,
    ExpenseRoutingModule,
    sharedModule
  ]
})
export class ExpenseModule { }
