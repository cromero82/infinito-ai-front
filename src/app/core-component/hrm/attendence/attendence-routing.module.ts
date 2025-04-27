import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendenceComponent } from './attendence.component';
import { AttendanceAdminComponent } from './attendance-admin/attendance-admin.component';
import { AttendanceEmployeeComponent } from './attendance-employee/attendance-employee.component';

const routes: Routes = [
  {
    path: '',
    component: AttendenceComponent,
    children: [
      { path: 'attendance-admin', component: AttendanceAdminComponent },
      { path: 'attendance-employee', component: AttendanceEmployeeComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendenceRoutingModule {}
