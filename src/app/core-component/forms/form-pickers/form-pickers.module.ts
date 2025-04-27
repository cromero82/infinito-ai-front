import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormPickersRoutingModule } from './form-pickers-routing.module';
import { FormPickersComponent } from './form-pickers.component';
import { CalendarModule } from 'primeng/calendar';

import { ColorPickerModule } from 'primeng/colorpicker';
import { FormsModule } from '@angular/forms';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    FormPickersComponent
  ],
  imports: [
    CommonModule,
    FormPickersRoutingModule,
    CalendarModule,
    ColorPickerModule,
    sharedModule,
    FormsModule
  ]
})
export class FormPickersModule { }
