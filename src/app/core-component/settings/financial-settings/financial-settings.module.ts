import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FinancialSettingsRoutingModule } from './financial-settings-routing.module';
import { FinancialSettingsComponent } from './financial-settings.component';
import { CurrencySettingsComponent } from './currency-settings/currency-settings.component';
import { BankSettingsGridComponent } from './bank-settings-grid/bank-settings-grid.component';
import { BankSettingsListComponent } from './bank-settings-list/bank-settings-list.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { PaymentGatewaySettingsComponent } from './payment-gateway-settings/payment-gateway-settings.component';
import { TaxRatesComponent } from './tax-rates/tax-rates.component';


@NgModule({
  declarations: [
    FinancialSettingsComponent,
    BankSettingsGridComponent,
    BankSettingsListComponent,
    CurrencySettingsComponent,
    PaymentGatewaySettingsComponent,
    TaxRatesComponent
  ],
  imports: [
    CommonModule,
    FinancialSettingsRoutingModule,
    sharedModule
  ]
})
export class FinancialSettingsModule { }
