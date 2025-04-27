import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Pos5Component } from './pos-5.component';

const routes: Routes = [{ path: '', component: Pos5Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Pos5RoutingModule { }
