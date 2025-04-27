import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Pos4Component } from './pos-4.component';

const routes: Routes = [{ path: '', component: Pos4Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Pos4RoutingModule { }
