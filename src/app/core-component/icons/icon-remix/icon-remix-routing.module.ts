import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconRemixComponent } from './icon-remix.component';

const routes: Routes = [{ path: '', component: IconRemixComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconRemixRoutingModule { }
