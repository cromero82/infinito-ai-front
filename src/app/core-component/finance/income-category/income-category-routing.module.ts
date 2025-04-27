import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IncomeCategoryComponent } from './income-category.component';

const routes: Routes = [{ path: '', component: IncomeCategoryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IncomeCategoryRoutingModule { }
