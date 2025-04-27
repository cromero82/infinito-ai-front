import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiNavTabsRoutingModule } from './ui-nav-tabs-routing.module';
import { UiNavTabsComponent } from './ui-nav-tabs.component';


@NgModule({
  declarations: [
    UiNavTabsComponent
  ],
  imports: [
    CommonModule,
    UiNavTabsRoutingModule
  ]
})
export class UiNavTabsModule { }
