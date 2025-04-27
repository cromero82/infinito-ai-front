import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiPopoversRoutingModule } from './ui-popovers-routing.module';
import { UiPopoversComponent } from './ui-popovers.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UiPopoversComponent
  ],
  imports: [
    CommonModule,
    UiPopoversRoutingModule,
    sharedModule
  ]
})
export class UiPopoversModule { }
