import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiTooltipsComponent } from './ui-tooltips.component';

const routes: Routes = [{ path: '', component: UiTooltipsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiTooltipsRoutingModule { }
