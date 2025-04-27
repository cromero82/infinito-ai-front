import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiBreadcrumbRoutingModule } from './ui-breadcrumb-routing.module';
import { UiBreadcrumbComponent } from './ui-breadcrumb.component';


@NgModule({
  declarations: [
    UiBreadcrumbComponent
  ],
  imports: [
    CommonModule,
    UiBreadcrumbRoutingModule
  ]
})
export class UiBreadcrumbModule { }
