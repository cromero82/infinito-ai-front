import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { BarcodeComponent } from './barcode/barcode.component';
import { BrandListComponent } from './brand-list/brand-list.component';
import { CategoryListComponent } from './category/category-list/category-list.component';
import { WarrantyComponent } from './warranty/warranty.component';
import { UnitsComponent } from './units/units.component';
import { VarriantAttributesComponent } from './varriant-attributes/varriant-attributes.component';
import { QrcodeComponent } from './qrcode/qrcode.component';

const routes: Routes = [
  {
    path: '',
    component: InventoryComponent,
    children: [
      { path: 'barcode', component: BarcodeComponent },
      { path: 'barcode', component: BarcodeComponent },
      { path: 'brand-list', component: BrandListComponent },
      { path: 'category-list', component: CategoryListComponent },
      { path: 'warranty', component: WarrantyComponent },
      {
        path: 'product',
        loadChildren: () =>
          import('./product/product.module').then((m) => m.ProductModule),
      },
      {
        path: 'category',
        loadChildren: () =>
          import('./category/category.module').then((m) => m.CategoryModule),
      },
      {
        path: 'units',
        component: UnitsComponent,
      },
      {
        path: 'varriant-attributes',
        component: VarriantAttributesComponent,
      },
      {
        path: 'qrcode',
        component: QrcodeComponent,
      },
      {
        path: 'stock',
        loadChildren: () =>
          import('./stock/stock.module').then((m) => m.StockModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoryRoutingModule {}
