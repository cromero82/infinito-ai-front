import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiStickynoteRoutingModule } from './ui-stickynote-routing.module';
import { UiStickynoteComponent } from './ui-stickynote.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    UiStickynoteComponent
  ],
  imports: [
    CommonModule,
    UiStickynoteRoutingModule,
    FormsModule
  ]
})
export class UiStickynoteModule { }
