import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiBreadcrumbComponent } from './ui-breadcrumb.component';

const routes: Routes = [{ path: '', component: UiBreadcrumbComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiBreadcrumbRoutingModule { }
