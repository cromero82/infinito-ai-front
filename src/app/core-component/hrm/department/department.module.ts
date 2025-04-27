import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepartmentRoutingModule } from './department-routing.module';
import { DepartmentComponent } from './department.component';
import { DepartmentGridComponent } from './department-grid/department-grid.component';
import { DepartmentListComponent } from './department-list/department-list.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    DepartmentComponent,
    DepartmentGridComponent,
    DepartmentListComponent
    
  ],
  imports: [
    CommonModule,
    DepartmentRoutingModule,
    
    sharedModule
  ]
})
export class DepartmentModule { }
