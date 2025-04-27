import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiMediaComponent } from './ui-media.component';

const routes: Routes = [{ path: '', component: UiMediaComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiMediaRoutingModule { }
