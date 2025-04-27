import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinanceComponent } from './finance.component';

const routes: Routes = [
  { path: '', 
    component: FinanceComponent,
    children:[
      { path: 'income', loadChildren: () => import('./income/income.module').then(m => m.IncomeModule) },
      { path: 'income-category', loadChildren: () => import('./income-category/income-category.module').then(m => m.IncomeCategoryModule) },
      { path: 'account-list', loadChildren: () => import('./account-list/account-list.module').then(m => m.AccountListModule) },
      { path: 'money-transfer', loadChildren: () => import('./money-transfer/money-transfer.module').then(m => m.MoneyTransferModule) },
      { path: 'balance-sheet', loadChildren: () => import('./balance-sheet/balance-sheet.module').then(m => m.BalanceSheetModule) },
      { path: 'trial-balance', loadChildren: () => import('./trial-balance/trial-balance.module').then(m => m.TrialBalanceModule) },
      { path: 'cash-flow', loadChildren: () => import('./cash-flow/cash-flow.module').then(m => m.CashFlowModule) },
      { path: 'account-statement', loadChildren: () => import('./account-statement/account-statement.module').then(m => m.AccountStatementModule) },
    ]
   },
 ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule { }
