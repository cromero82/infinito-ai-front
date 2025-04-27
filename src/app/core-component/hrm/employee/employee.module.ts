import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeComponent } from './employee.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { EditEmployeeComponent } from './edit-employee/edit-employee.component';
import { EmployeeGridComponent } from './employee-grid/employee-grid.component';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { AddEmployeeComponent } from './add-employee/add-employee.component';


@NgModule({
  declarations: [
    EmployeeComponent,
    EditEmployeeComponent,
    EmployeeGridComponent,
    EmployeeListComponent,
    AddEmployeeComponent
  ],
  imports: [
    CommonModule,
    EmployeeRoutingModule,
    sharedModule
  ]
})
export class EmployeeModule { }
