import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiAvatarRoutingModule } from './ui-avatar-routing.module';
import { UiAvatarComponent } from './ui-avatar.component';


@NgModule({
  declarations: [
    UiAvatarComponent
  ],
  imports: [
    CommonModule,
    UiAvatarRoutingModule
  ]
})
export class UiAvatarModule { }
