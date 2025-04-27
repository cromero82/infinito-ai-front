import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { CustomerReportComponent } from './customer-report/customer-report.component';
import { ExpenseReportComponent } from './expense-report/expense-report.component';
import { IncomeReportComponent } from './income-report/income-report.component';
import { InvoiceReportComponent } from './invoice-report/invoice-report.component';
import { ProfitAndLossComponent } from './profit-and-loss/profit-and-loss.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { SupplierReportComponent } from './supplier-report/supplier-report.component';
import { TaxReportComponent } from './tax-report/tax-report.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { BestSellerComponent } from './best-seller/best-seller.component';
import { StockHistoryComponent } from './stock-history/stock-history.component';
import { SoldStockComponent } from './sold-stock/sold-stock.component';
import { SupplierDueReportComponent } from './supplier-due-report/supplier-due-report.component';
import { CustomerDueReportComponent } from './customer-due-report/customer-due-report.component';
import { AnnualReportComponent } from './annual-report/annual-report.component';
import { ProductReportComponent } from './product/product-report/product-report.component';
import { ProductExpiryReportComponent } from './product/product-expiry-report/product-expiry-report.component';
import { ProductQuantityAlertComponent } from './product/product-quantity-alert/product-quantity-alert.component';
import { SalesTaxComponent } from './sales-tax/sales-tax.component';

const routes: Routes = [{ path: '', component: ReportsComponent,
children: [
  {
    path: 'customer-report',
    component: CustomerReportComponent
  },
  {
    path: 'expense-report',
    component: ExpenseReportComponent
  },
  {
    path: 'income-report',
    component: IncomeReportComponent
  },
  {
    path: 'inventory-report',
    component: InventoryReportComponent
  },
  {
    path: 'invoice-report',
    component: InvoiceReportComponent
  },
  {
    path: 'profit-and-loss',
    component: ProfitAndLossComponent
  },
  {
    path: 'purchase-report',
    component: PurchaseReportComponent
  },
  {
    path: 'sales-report',
    component: SalesReportComponent
  },
  {
    path: 'best-seller',
    component: BestSellerComponent
  },
  {
    path: 'supplier-report',
    component: SupplierReportComponent
  },
  {
    path: 'stock-history',
    component: StockHistoryComponent
  },
  {
    path: 'sold-stock',
    component: SoldStockComponent
  },
  {
    path: 'supplier-due-report',
    component: SupplierDueReportComponent
  },
  {
    path: 'customer-due-report',
    component: CustomerDueReportComponent
  },
  {
    path: 'tax-report',
    component: TaxReportComponent
  },
  {
    path: 'annual-report',
    component: AnnualReportComponent
  },
  {
    path:'product-report',
    component:ProductReportComponent
  },
  {
    path:'product-expiry-report',
    component:ProductExpiryReportComponent
  },
  {
    path:'sales-tax',
    component:SalesTaxComponent
  },
  {
    path:'product-quantity-alert',
    component:ProductQuantityAlertComponent
  },
  { path: 'product', loadChildren: () => import('./product/product.module').then(m => m.ProductModule) }
]
},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
