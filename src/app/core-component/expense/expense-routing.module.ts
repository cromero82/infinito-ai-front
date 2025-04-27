import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseComponent } from './expense.component';

import { ExpenseCategoryComponent } from './expense-category/expense-category.component';
import { ExpenseListComponent } from './expense-list/expense-list.component';

const routes: Routes = [
  {
    path: '',
    component: ExpenseComponent,
    children: [
      { path: 'expense-category', component: ExpenseCategoryComponent },
      { path: 'expense-list', component:ExpenseListComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExpenseRoutingModule {}
