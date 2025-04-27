import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconMaterialComponent } from './icon-material.component';

const routes: Routes = [{ path: '', component: IconMaterialComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconMaterialRoutingModule { }
