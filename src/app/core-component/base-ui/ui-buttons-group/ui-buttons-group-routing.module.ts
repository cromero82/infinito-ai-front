import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiButtonsGroupComponent } from './ui-buttons-group.component';

const routes: Routes = [{ path: '', component: UiButtonsGroupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiButtonsGroupRoutingModule { }
