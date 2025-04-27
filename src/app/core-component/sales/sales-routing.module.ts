import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesComponent } from './sales.component';
import { SalesListComponent } from './sales-list/sales-list.component';
import { SalesReturnsComponent } from './sales-returns/sales-returns.component';
import { QuotationListComponent } from './quotation-list/quotation-list.component';
import { PosComponent } from './pos/pos.component';

const routes: Routes = [{ path: '', component: SalesComponent,
children: [
  {
    path: 'online-order',
    component: SalesListComponent
  },
  {
    path: 'sales-return',
    component: SalesReturnsComponent
  },
  {
    path: 'quotation-list',
    component: QuotationListComponent
  },
  {
    path: 'pos',
    component: PosComponent
  },
  { path: 'pos-order', loadChildren: () => import('./pos-order/pos-order.module').then(m => m.PosOrderModule) },
  { path: 'invoice', loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule) },
  { path: 'invoice-details', loadChildren: () => import('./invoice-details/invoice-details.module').then(m => m.InvoiceDetailsModule) },
  { path: 'pos-2', loadChildren: () => import('./pos-2/pos-2.module').then(m => m.Pos2Module) },
  { path: 'pos-3', loadChildren: () => import('./pos-3/pos-3.module').then(m => m.Pos3Module) },
  { path: 'pos-4', loadChildren: () => import('./pos-4/pos-4.module').then(m => m.Pos4Module) },
  { path: 'pos-5', loadChildren: () => import('./pos-5/pos-5.module').then(m => m.Pos5Module) },
]
},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesRoutingModule { }
