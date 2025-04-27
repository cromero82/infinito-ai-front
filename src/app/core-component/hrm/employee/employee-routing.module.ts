import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeComponent } from './employee.component';
import { AddEmployeeComponent } from './add-employee/add-employee.component';
import { EditEmployeeComponent } from './edit-employee/edit-employee.component';
import { EmployeeGridComponent } from './employee-grid/employee-grid.component';
import { EmployeeListComponent } from './employee-list/employee-list.component';

const routes: Routes = [
  {
    path: '',
    component: EmployeeComponent,
    children: [
      {
        path: 'add-employee',
        component: AddEmployeeComponent,
      },
      {
        path: 'edit-employee',
        component: EditEmployeeComponent,
      },
      {
        path: 'employee-grid',
        component: EmployeeGridComponent,
      },
      {
        path: 'employee-list',
        component: EmployeeListComponent,
      },
      { path: 'employee-details', loadChildren: () => import('./employee-details/employee-details.module').then(m => m.EmployeeDetailsModule) },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}
