import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebsiteSettingsComponent } from './website-settings.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { LanguageSettingsComponent } from './language-settings/language-settings.component';
import { LanguageSettingsWebComponent } from './language-settings-web/language-settings-web.component';
import { AppearanceComponent } from './appearance/appearance.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';
import { PrefixesComponent } from './prefixes/prefixes.component';
import { PreferenceComponent } from './preference/preference.component';
import { LocalizationSettingsComponent } from './localization-settings/localization-settings.component';
import { SocialAuthenticationComponent } from './social-authentication/social-authentication.component';

const routes: Routes = [
  {
    path: '',
    component: WebsiteSettingsComponent,
    children: [
      {
        path: 'company-settings',
        component: CompanySettingsComponent,
      },
      { path: 'language-settings', component: LanguageSettingsComponent },
      {
        path: 'language-settings-web',
        component: LanguageSettingsWebComponent,
      },
      {
        path: 'appearance',
        component: AppearanceComponent,
      },
      {
        path: 'system-settings',
        component: SystemSettingsComponent
      },
      {
        path: 'prefixes',
        component: PrefixesComponent
      },
      {
        path: 'preference',
        component: PreferenceComponent
      },
      {
        path: 'localization-settings',
        component: LocalizationSettingsComponent
      },
      {
        path: 'social-authentication',
        component: SocialAuthenticationComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WebsiteSettingsRoutingModule {}
