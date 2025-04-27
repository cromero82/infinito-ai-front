import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiToastsRoutingModule } from './ui-toasts-routing.module';
import { UiToastsComponent } from './ui-toasts.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UiToastsComponent
  ],
  imports: [
    CommonModule,
    UiToastsRoutingModule,
    sharedModule
  ]
})
export class UiToastsModule { }
