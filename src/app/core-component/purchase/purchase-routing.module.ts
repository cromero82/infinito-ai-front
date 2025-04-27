import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseComponent } from './purchase.component';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { PurchaseOrderReportComponent } from './purchase-order-report/purchase-order-report.component';
import { PurchaseReturnsComponent } from './purchase-returns/purchase-returns.component';

const routes: Routes = [
  {
    path: '',
    component: PurchaseComponent,
    children: [
      { path: 'purchase-list', component: PurchaseListComponent },
      { path: 'purchase-order-report', component: PurchaseOrderReportComponent },
      { path: 'purchase-returns', component: PurchaseReturnsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchaseRoutingModule {}
