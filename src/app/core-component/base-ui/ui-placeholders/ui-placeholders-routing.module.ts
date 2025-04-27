import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiPlaceholdersComponent } from './ui-placeholders.component';

const routes: Routes = [{ path: '', component: UiPlaceholdersComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiPlaceholdersRoutingModule { }
