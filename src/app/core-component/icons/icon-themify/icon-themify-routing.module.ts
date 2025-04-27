import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconThemifyComponent } from './icon-themify.component';

const routes: Routes = [{ path: '', component: IconThemifyComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconThemifyRoutingModule { }
