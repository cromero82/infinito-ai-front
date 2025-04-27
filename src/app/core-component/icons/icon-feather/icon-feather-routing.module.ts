import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconFeatherComponent } from './icon-feather.component';

const routes: Routes = [{ path: '', component: IconFeatherComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconFeatherRoutingModule { }
