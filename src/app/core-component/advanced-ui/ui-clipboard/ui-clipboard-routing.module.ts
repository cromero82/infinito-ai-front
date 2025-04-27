import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiClipboardComponent } from './ui-clipboard.component';

const routes: Routes = [{ path: '', component: UiClipboardComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiClipboardRoutingModule { }
