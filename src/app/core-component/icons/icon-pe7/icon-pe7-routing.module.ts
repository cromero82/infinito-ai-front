import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconPe7Component } from './icon-pe7.component';

const routes: Routes = [{ path: '', component: IconPe7Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconPe7RoutingModule { }
