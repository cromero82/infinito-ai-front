import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Pos2Component } from './pos-2.component';

const routes: Routes = [{ path: '', component: Pos2Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Pos2RoutingModule { }
