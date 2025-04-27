import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiLightboxComponent } from './ui-lightbox.component';

const routes: Routes = [{ path: '', component: UiLightboxComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiLightboxRoutingModule { }
