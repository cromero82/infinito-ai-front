import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PayrollComponent } from './payroll.component';
import { PayslipComponent } from './payslip/payslip.component';
import { PayrollListComponent } from './payroll-list/payroll-list.component';

const routes: Routes = [
  {
    path: '',
    component: PayrollComponent,
    children: [
      { path: 'payroll-list', component: PayrollListComponent },
      { path: 'payslip', component: PayslipComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PayrollRoutingModule {}
