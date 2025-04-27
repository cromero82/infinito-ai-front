import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiCounterComponent } from './ui-counter.component';

const routes: Routes = [{ path: '', component: UiCounterComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiCounterRoutingModule { }
