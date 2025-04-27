import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SmsTemplatesRoutingModule } from './sms-templates-routing.module';
import { SmsTemplatesComponent } from './sms-templates.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    SmsTemplatesComponent
  ],
  imports: [
    CommonModule,
    SmsTemplatesRoutingModule,
    sharedModule
  ]
})
export class SmsTemplatesModule { }
