import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiImagesComponent } from './ui-images.component';

const routes: Routes = [{ path: '', component: UiImagesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiImagesRoutingModule { }
