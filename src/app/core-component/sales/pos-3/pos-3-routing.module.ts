import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Pos3Component } from './pos-3.component';

const routes: Routes = [{ path: '', component: Pos3Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Pos3RoutingModule { }
