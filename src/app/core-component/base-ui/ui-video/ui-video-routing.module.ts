import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiVideoComponent } from './ui-video.component';

const routes: Routes = [{ path: '', component: UiVideoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiVideoRoutingModule { }
