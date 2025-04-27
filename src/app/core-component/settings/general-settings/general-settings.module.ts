import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GeneralSettingsRoutingModule } from './general-settings-routing.module';
import { GeneralSettingsComponent } from './general-settings.component';
import { ConnectedAppsComponent } from './connected-apps/connected-apps.component';
import { ProfileComponent } from './profile/profile.component';
import { SecuritySettingsComponent } from './security-settings/security-settings.component';
import { NotificationComponent } from './notification/notification.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    GeneralSettingsComponent,
    ConnectedAppsComponent,
    SecuritySettingsComponent,
    ProfileComponent,
    NotificationComponent
  ],
  imports: [
    CommonModule,
    GeneralSettingsRoutingModule,
    sharedModule
  ]
})
export class GeneralSettingsModule { }
