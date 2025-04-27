import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductRoutingModule } from './product-routing.module';
import { ProductComponent } from './product.component';
import { EditProductComponent } from './edit-product/edit-product.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { ProductListComponent } from './product-list/product-list.component';
import { AddProductComponent } from './add-product/add-product.component';
import { ExpiredProductsComponent } from './expired-products/expired-products.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { TagInputModule } from 'ngx-chips';


@NgModule({
  declarations: [
    ProductComponent,
    EditProductComponent,
    ProductListComponent,
    AddProductComponent,
    ExpiredProductsComponent,
    ProductDetailsComponent
  ],
  imports: [
    CommonModule,
    ProductRoutingModule,
    sharedModule,
    TagInputModule
  ]
})
export class ProductModule { }
