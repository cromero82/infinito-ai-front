import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiDropdownsComponent } from './ui-dropdowns.component';

const routes: Routes = [{ path: '', component: UiDropdownsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiDropdownsRoutingModule { }
