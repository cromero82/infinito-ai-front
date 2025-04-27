import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconFlagComponent } from './icon-flag.component';

const routes: Routes = [{ path: '', component: IconFlagComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconFlagRoutingModule { }
