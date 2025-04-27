import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiTimelineComponent } from './ui-timeline.component';

const routes: Routes = [{ path: '', component: UiTimelineComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiTimelineRoutingModule { }
