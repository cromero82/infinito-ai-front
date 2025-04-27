import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiPaginationComponent } from './ui-pagination.component';

const routes: Routes = [{ path: '', component: UiPaginationComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiPaginationRoutingModule { }
