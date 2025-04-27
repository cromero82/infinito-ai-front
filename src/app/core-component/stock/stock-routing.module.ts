import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockComponent } from './stock.component';
import { ManageStocksComponent } from './manage-stocks/manage-stocks.component';
import { StockAdjustmentComponent } from './stock-adjustment/stock-adjustment.component';
import { StockTransferComponent } from './stock-transfer/stock-transfer.component';

const routes: Routes = [
  {
    path: '',
    component: StockComponent,
    children: [
      {
        path: 'manage-stocks',
        component: ManageStocksComponent,
      },
      {
        path: 'stock-adjustment',
        component: StockAdjustmentComponent,
      },
      {
        path: 'stock-transfer',
        component: StockTransferComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StockRoutingModule {}
