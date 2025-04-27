import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { HrmRoutingModule } from './hrm-routing.module';
import { HrmComponent } from './hrm.component';
import { DesignationComponent } from './designation/designation.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { HolidaysComponent } from './holidays/holidays.component';
import { ShiftComponent } from './shift/shift.component';

@NgModule({
  declarations: [
    HrmComponent,
    HolidaysComponent,
    DesignationComponent,
    ShiftComponent,
  ],
  imports: [CommonModule, HrmRoutingModule, sharedModule],
  providers: [
    DatePipe,
  ]
})
export class HrmModule {}
