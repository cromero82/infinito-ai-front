import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiStickynoteComponent } from './ui-stickynote.component';

const routes: Routes = [{ path: '', component: UiStickynoteComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiStickynoteRoutingModule { }
