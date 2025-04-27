import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PayrollRoutingModule } from './payroll-routing.module';
import { PayrollComponent } from './payroll.component';
import { PayrollListComponent } from './payroll-list/payroll-list.component';
import { PayslipComponent } from './payslip/payslip.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    PayrollComponent,
    PayrollListComponent,
    PayslipComponent
  ],
  imports: [
    CommonModule,
    PayrollRoutingModule,
    sharedModule
  ]
})
export class PayrollModule { }
