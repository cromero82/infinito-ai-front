import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiBadgesComponent } from './ui-badges.component';

const routes: Routes = [{ path: '', component: UiBadgesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiBadgesRoutingModule { }
