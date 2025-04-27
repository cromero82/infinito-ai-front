import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeavesComponent } from './leaves.component';
import { LeavesAdminComponent } from './leaves-admin/leaves-admin.component';
import { LeavesEmployeeComponent } from './leaves-employee/leaves-employee.component';
import { LeavesTypeComponent } from './leaves-type/leaves-type.component';

const routes: Routes = [
  {
    path: '',
    component: LeavesComponent,
    children: [
      { path: 'leaves-admin', component: LeavesAdminComponent },
      { path: 'leaves-employee', component: LeavesEmployeeComponent },
      { path: 'leaves-type', component: LeavesTypeComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeavesRoutingModule {}
