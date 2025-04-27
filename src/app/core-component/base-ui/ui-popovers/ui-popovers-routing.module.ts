import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiPopoversComponent } from './ui-popovers.component';

const routes: Routes = [{ path: '', component: UiPopoversComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiPopoversRoutingModule { }
