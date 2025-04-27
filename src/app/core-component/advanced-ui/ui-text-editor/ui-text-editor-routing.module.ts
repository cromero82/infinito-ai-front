import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiTextEditorComponent } from './ui-text-editor.component';

const routes: Routes = [{ path: '', component: UiTextEditorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiTextEditorRoutingModule { }
