import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebsiteSettingsRoutingModule } from './website-settings-routing.module';
import { WebsiteSettingsComponent } from './website-settings.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { LanguageSettingsWebComponent } from './language-settings-web/language-settings-web.component';
import { LanguageSettingsComponent } from './language-settings/language-settings.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { AppearanceComponent } from './appearance/appearance.component';
import { PrefixesComponent } from './prefixes/prefixes.component';
import { LocalizationSettingsComponent } from './localization-settings/localization-settings.component';
import { PreferenceComponent } from './preference/preference.component';
import { SocialAuthenticationComponent } from './social-authentication/social-authentication.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';
import { TagInputModule } from 'ngx-chips';


@NgModule({
  declarations: [
    WebsiteSettingsComponent,
    CompanySettingsComponent,
    LanguageSettingsComponent,
    LanguageSettingsWebComponent,
    AppearanceComponent,
    PrefixesComponent,
    LocalizationSettingsComponent,
    PreferenceComponent,
    SocialAuthenticationComponent,
    SystemSettingsComponent
  ],
  imports: [
    CommonModule,
    WebsiteSettingsRoutingModule,
    sharedModule,
    TagInputModule
  ]
})
export class WebsiteSettingsModule { }
