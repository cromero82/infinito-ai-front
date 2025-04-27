import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SystemSettingsRoutingModule } from './system-settings-routing.module';
import { SystemSettingsComponent } from './system-settings.component';
import { GdprSettingsComponent } from './gdpr-settings/gdpr-settings.component';
import { EmailSettingsComponent } from './email-settings/email-settings.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { OtpSettingsComponent } from './otp-settings/otp-settings.component';
import { SmsGatewayComponent } from './sms-gateway/sms-gateway.component';


@NgModule({
  declarations: [
    SystemSettingsComponent,
    GdprSettingsComponent,
    EmailSettingsComponent,
    OtpSettingsComponent,
    SmsGatewayComponent
  ],
  imports: [
    CommonModule,
    SystemSettingsRoutingModule,
    sharedModule
  ]
})
export class SystemSettingsModule { }
