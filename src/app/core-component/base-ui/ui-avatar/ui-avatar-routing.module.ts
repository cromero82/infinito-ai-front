import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiAvatarComponent } from './ui-avatar.component';

const routes: Routes = [{ path: '', component: UiAvatarComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiAvatarRoutingModule { }
