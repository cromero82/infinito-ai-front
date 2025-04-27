import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { CustomerReportComponent } from './customer-report/customer-report.component';
import { ExpenseReportComponent } from './expense-report/expense-report.component';
import { IncomeReportComponent } from './income-report/income-report.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { InvoiceReportComponent } from './invoice-report/invoice-report.component';
import { ProfitAndLossComponent } from './profit-and-loss/profit-and-loss.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { SupplierReportComponent } from './supplier-report/supplier-report.component';
import { TaxReportComponent } from './tax-report/tax-report.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { BestSellerComponent } from './best-seller/best-seller.component';
import { SoldStockComponent } from './sold-stock/sold-stock.component';
import { StockHistoryComponent } from './stock-history/stock-history.component';
import { AnnualReportComponent } from './annual-report/annual-report.component';
import { CustomerDueReportComponent } from './customer-due-report/customer-due-report.component';
import { ProductExpiryReportComponent } from './product/product-expiry-report/product-expiry-report.component';
import { ProductQuantityAlertComponent } from './product/product-quantity-alert/product-quantity-alert.component';
import { ProductReportComponent } from './product/product-report/product-report.component';
import { SupplierDueReportComponent } from './supplier-due-report/supplier-due-report.component';
import { SalesTaxComponent } from './sales-tax/sales-tax.component';

@NgModule({
  declarations: [
    ReportsComponent,
    CustomerReportComponent,
    ExpenseReportComponent,
    IncomeReportComponent,
    InventoryReportComponent,
    InvoiceReportComponent,
    ProfitAndLossComponent,
    PurchaseReportComponent,
    SalesReportComponent,
    SupplierReportComponent,
    TaxReportComponent,
    BestSellerComponent,
    SoldStockComponent,
    StockHistoryComponent,
    AnnualReportComponent,
    CustomerDueReportComponent,
    SupplierReportComponent,
    ProductReportComponent,
    ProductExpiryReportComponent,
    ProductQuantityAlertComponent,
    SupplierDueReportComponent,
    SalesTaxComponent
  ],
  imports: [CommonModule, ReportsRoutingModule, sharedModule],
})
export class ReportsModule {}
