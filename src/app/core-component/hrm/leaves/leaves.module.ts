import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeavesRoutingModule } from './leaves-routing.module';
import { LeavesComponent } from './leaves.component';
import { LeavesAdminComponent } from './leaves-admin/leaves-admin.component';
import { LeavesEmployeeComponent } from './leaves-employee/leaves-employee.component';
import { LeavesTypeComponent } from './leaves-type/leaves-type.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    LeavesComponent,
    LeavesAdminComponent,
    LeavesEmployeeComponent,
    LeavesTypeComponent
  ],
  imports: [
    CommonModule,
    LeavesRoutingModule,
    sharedModule
    
  ]
})
export class LeavesModule { }
