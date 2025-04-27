import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiClipboardRoutingModule } from './ui-clipboard-routing.module';
import { UiClipboardComponent } from './ui-clipboard.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UiClipboardComponent
  ],
  imports: [
    CommonModule,
    UiClipboardRoutingModule,
    sharedModule
  ]
})
export class UiClipboardModule { }
