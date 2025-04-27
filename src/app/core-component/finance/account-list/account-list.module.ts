import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountListRoutingModule } from './account-list-routing.module';
import { AccountListComponent } from './account-list.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    AccountListComponent
  ],
  imports: [
    CommonModule,
    AccountListRoutingModule,
    sharedModule
  ]
})
export class AccountListModule { }
