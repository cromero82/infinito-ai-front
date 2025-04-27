import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconBootstrapRoutingModule } from './icon-bootstrap-routing.module';
import { IconBootstrapComponent } from './icon-bootstrap.component';


@NgModule({
  declarations: [
    IconBootstrapComponent
  ],
  imports: [
    CommonModule,
    IconBootstrapRoutingModule
  ]
})
export class IconBootstrapModule { }
