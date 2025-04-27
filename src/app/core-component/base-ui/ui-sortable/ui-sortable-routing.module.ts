import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiSortableComponent } from './ui-sortable.component';

const routes: Routes = [{ path: '', component: UiSortableComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiSortableRoutingModule { }
