import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiNavTabsComponent } from './ui-nav-tabs.component';

const routes: Routes = [{ path: '', component: UiNavTabsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiNavTabsRoutingModule { }
