import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconTypiconComponent } from './icon-typicon.component';

const routes: Routes = [{ path: '', component: IconTypiconComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconTypiconRoutingModule { }
