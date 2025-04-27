import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconTablerComponent } from './icon-tabler.component';

const routes: Routes = [{ path: '', component: IconTablerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconTablerRoutingModule { }
