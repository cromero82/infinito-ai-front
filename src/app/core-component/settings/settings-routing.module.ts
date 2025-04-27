import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: 'financial-settings',
        loadChildren: () =>
          import('./financial-settings/financial-settings.module').then(
            (m) => m.FinancialSettingsModule
          ),
      },
      {
        path: 'other-settings',
        loadChildren: () =>
          import('./other-settings/other-settings.module').then(
            (m) => m.OtherSettingsModule
          ),
      },
      {
        path: 'system-settings',
        loadChildren: () =>
          import('./system-settings/system-settings.module').then(
            (m) => m.SystemSettingsModule
          ),
      },
      {
        path: 'app-settings',
        loadChildren: () =>
          import('./app-settings/app-settings.module').then(
            (m) => m.AppSettingsModule
          ),
      },
      {
        path: 'general-settings',
        loadChildren: () =>
          import('./general-settings/general-settings.module').then(
            (m) => m.GeneralSettingsModule
          ),
      },
      {
        path: 'website-settings',
        loadChildren: () =>
          import('./website-settings/website-settings.module').then(
            (m) => m.WebsiteSettingsModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
