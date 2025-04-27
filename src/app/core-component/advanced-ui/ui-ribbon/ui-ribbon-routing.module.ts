import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiRibbonComponent } from './ui-ribbon.component';

const routes: Routes = [{ path: '', component: UiRibbonComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiRibbonRoutingModule { }
