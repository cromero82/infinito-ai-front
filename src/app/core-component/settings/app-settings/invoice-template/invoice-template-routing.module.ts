import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceTemplateComponent } from './invoice-template.component';

const routes: Routes = [{ path: '', component: InvoiceTemplateComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceTemplateRoutingModule { }
