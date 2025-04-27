import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiTextEditorRoutingModule } from './ui-text-editor-routing.module';
import { UiTextEditorComponent } from './ui-text-editor.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UiTextEditorComponent
  ],
  imports: [
    CommonModule,
    UiTextEditorRoutingModule,
    sharedModule
  ]
})
export class UiTextEditorModule { }
