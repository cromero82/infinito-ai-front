import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiBordersComponent } from './ui-borders.component';

const routes: Routes = [{ path: '', component: UiBordersComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiBordersRoutingModule { }
