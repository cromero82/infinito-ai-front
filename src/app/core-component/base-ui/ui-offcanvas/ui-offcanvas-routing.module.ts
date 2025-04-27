import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiOffcanvasComponent } from './ui-offcanvas.component';

const routes: Routes = [{ path: '', component: UiOffcanvasComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiOffcanvasRoutingModule { }
