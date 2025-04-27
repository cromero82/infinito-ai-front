import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconIonicComponent } from './icon-ionic.component';

const routes: Routes = [{ path: '', component: IconIonicComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconIonicRoutingModule { }
