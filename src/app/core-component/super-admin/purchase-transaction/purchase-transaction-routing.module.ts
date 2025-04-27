import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseTransactionComponent } from './purchase-transaction.component';

const routes: Routes = [{ path: '', component: PurchaseTransactionComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseTransactionRoutingModule { }
