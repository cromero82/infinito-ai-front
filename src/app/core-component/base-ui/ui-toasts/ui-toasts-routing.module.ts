import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiToastsComponent } from './ui-toasts.component';

const routes: Routes = [{ path: '', component: UiToastsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiToastsRoutingModule { }
