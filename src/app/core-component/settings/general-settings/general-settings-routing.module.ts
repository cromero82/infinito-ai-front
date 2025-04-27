import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralSettingsComponent } from './general-settings.component';
import { ConnectedAppsComponent } from './connected-apps/connected-apps.component';
import { ProfileComponent } from './profile/profile.component';
import { SecuritySettingsComponent } from './security-settings/security-settings.component';
import { NotificationComponent } from './notification/notification.component';

const routes: Routes = [
  {
    path: '',
    component: GeneralSettingsComponent,
    children: [
      {
        path: 'connected-apps',
        component: ConnectedAppsComponent,
      },
      {
        path: 'notification',
        component: NotificationComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'security-settings',
        component: SecuritySettingsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeneralSettingsRoutingModule {}
