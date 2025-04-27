import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiScrollbarComponent } from './ui-scrollbar.component';

const routes: Routes = [{ path: '', component: UiScrollbarComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiScrollbarRoutingModule { }
