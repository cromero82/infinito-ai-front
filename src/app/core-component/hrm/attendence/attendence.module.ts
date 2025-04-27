import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AttendenceRoutingModule } from './attendence-routing.module';
import { AttendenceComponent } from './attendence.component';
import { AttendanceAdminComponent } from './attendance-admin/attendance-admin.component';
import { AttendanceEmployeeComponent } from './attendance-employee/attendance-employee.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    AttendenceComponent,
    AttendanceAdminComponent,
    AttendanceEmployeeComponent
  ],
  imports: [
    CommonModule,
    AttendenceRoutingModule,
    sharedModule
  ]
})
export class AttendenceModule { }
