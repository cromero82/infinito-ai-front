import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconSimplelineComponent } from './icon-simpleline.component';

const routes: Routes = [{ path: '', component: IconSimplelineComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconSimplelineRoutingModule { }
