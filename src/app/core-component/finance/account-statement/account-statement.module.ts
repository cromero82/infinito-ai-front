import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountStatementRoutingModule } from './account-statement-routing.module';
import { AccountStatementComponent } from './account-statement.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    AccountStatementComponent
  ],
  imports: [
    CommonModule,
    AccountStatementRoutingModule,
    sharedModule
  ]
})
export class AccountStatementModule { }
