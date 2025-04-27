import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockComponent } from './stock.component';
import { LowStocksComponent } from './low-stocks/low-stocks.component';

const routes: Routes = [{ path: '', component: StockComponent,
children: [
  {
    path: 'low-stocks',
    component: LowStocksComponent,
  },
]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockRoutingModule { }
