import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinancialSettingsComponent } from './financial-settings.component';
import { BankSettingsGridComponent } from './bank-settings-grid/bank-settings-grid.component';
import { BankSettingsListComponent } from './bank-settings-list/bank-settings-list.component';
import { CurrencySettingsComponent } from './currency-settings/currency-settings.component';
import { PaymentGatewaySettingsComponent } from './payment-gateway-settings/payment-gateway-settings.component';
import { TaxRatesComponent } from './tax-rates/tax-rates.component';

const routes: Routes = [
  {
    path: '',
    component: FinancialSettingsComponent,
    children: [
      {
        path: 'bank-settings-grid',
        component: BankSettingsGridComponent,
      },
      {
        path: 'bank-settings-list',
        component: BankSettingsListComponent,
      },
      {
        path: 'currency-settings',
        component: CurrencySettingsComponent,
      },
      {
        path: 'payment-gateway-settings',
        component: PaymentGatewaySettingsComponent,
      },
      {
        path: 'tax-rates',
        component: TaxRatesComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FinancialSettingsRoutingModule {}
