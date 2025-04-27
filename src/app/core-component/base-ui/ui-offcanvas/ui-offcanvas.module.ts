import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiOffcanvasRoutingModule } from './ui-offcanvas-routing.module';
import { UiOffcanvasComponent } from './ui-offcanvas.component';


@NgModule({
  declarations: [
    UiOffcanvasComponent
  ],
  imports: [
    CommonModule,
    UiOffcanvasRoutingModule
  ]
})
export class UiOffcanvasModule { }
