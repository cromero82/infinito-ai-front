import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HrmComponent } from './hrm.component';
import { DesignationComponent } from './designation/designation.component';
import { HolidaysComponent } from './holidays/holidays.component';
import { ShiftComponent } from './shift/shift.component';

const routes: Routes = [
  {
    path: '',
    component: HrmComponent,
    children: [
      { path: 'designation', component: DesignationComponent },
      {
        path: 'department',
        loadChildren: () =>
          import('./department/department.module').then(
            (m) => m.DepartmentModule
          ),
      },
      {
        path: 'attendance',
        loadChildren: () =>
          import('./attendence/attendence.module').then(
            (m) => m.AttendenceModule
          ),
      },
      {
        path: 'employee',
        loadChildren: () =>
          import('./employee/employee.module').then((m) => m.EmployeeModule),
      },
      {
        path: 'holidays',
        component: HolidaysComponent,
      },
      {
        path: 'leaves',
        loadChildren: () =>
          import('./leaves/leaves.module').then((m) => m.LeavesModule),
      },
      {
        path: 'shift',
        component: ShiftComponent,
      },
      {
        path: 'payroll',
        loadChildren: () =>
          import('./payroll/payroll.module').then((m) => m.PayrollModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HrmRoutingModule {}
