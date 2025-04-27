import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiColorsComponent } from './ui-colors.component';

const routes: Routes = [{ path: '', component: UiColorsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiColorsRoutingModule { }
