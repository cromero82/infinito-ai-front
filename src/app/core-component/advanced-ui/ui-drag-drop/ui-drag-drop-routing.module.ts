import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiDragDropComponent } from './ui-drag-drop.component';

const routes: Routes = [{ path: '', component: UiDragDropComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiDragDropRoutingModule { }
