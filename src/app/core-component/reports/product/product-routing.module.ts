import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductComponent } from './product.component';
import { ProductReportComponent } from './product-report/product-report.component';
import { ProductQuantityAlertComponent } from './product-quantity-alert/product-quantity-alert.component';
import { ProductExpiryReportComponent } from './product-expiry-report/product-expiry-report.component';

const routes: Routes = [
  { path: '', 
    component: ProductComponent,
   }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule { }
