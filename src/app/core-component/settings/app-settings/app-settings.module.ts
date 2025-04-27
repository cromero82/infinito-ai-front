import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppSettingsRoutingModule } from './app-settings-routing.module';
import { AppSettingsComponent } from './app-settings.component';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { InvoiceSettingsComponent } from './invoice-settings/invoice-settings.component';
import { PosSettingsComponent } from './pos-settings/pos-settings.component';
import { PrinterSettingsComponent } from './printer-settings/printer-settings.component';


@NgModule({
  declarations: [
    AppSettingsComponent,
    CustomFieldsComponent,
    InvoiceSettingsComponent,
    PosSettingsComponent,
    PrinterSettingsComponent

  ],
  imports: [
    CommonModule,
    AppSettingsRoutingModule,
    sharedModule
  ]
})
export class AppSettingsModule { }
