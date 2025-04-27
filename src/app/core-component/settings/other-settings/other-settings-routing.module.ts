import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OtherSettingsComponent } from './other-settings.component';
import { BanIpAddressComponent } from './ban-ip-address/ban-ip-address.component';
import { StorageSettingsComponent } from './storage-settings/storage-settings.component';

const routes: Routes = [
  {
    path: '',
    component: OtherSettingsComponent,
    children: [
      {
        path: 'ban-ip-address',
        component: BanIpAddressComponent,
      },
      {
        path: 'storage-settings',
        component: StorageSettingsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OtherSettingsRoutingModule {}
