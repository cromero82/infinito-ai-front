import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OtherSettingsRoutingModule } from './other-settings-routing.module';
import { OtherSettingsComponent } from './other-settings.component';
import { BanIpAddressComponent } from './ban-ip-address/ban-ip-address.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { StorageSettingsComponent } from './storage-settings/storage-settings.component';


@NgModule({
  declarations: [
    OtherSettingsComponent,
    BanIpAddressComponent,
    StorageSettingsComponent
  ],
  imports: [
    CommonModule,
    OtherSettingsRoutingModule,
    sharedModule
  ]
})
export class OtherSettingsModule { }
