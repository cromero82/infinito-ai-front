import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiProgressComponent } from './ui-progress.component';

const routes: Routes = [{ path: '', component: UiProgressComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiProgressRoutingModule { }
