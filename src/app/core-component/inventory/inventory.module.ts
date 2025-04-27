import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryComponent } from './inventory.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { BarcodeComponent } from './barcode/barcode.component';
import { WarrantyComponent } from './warranty/warranty.component';
import { BrandListComponent } from './brand-list/brand-list.component';
import { UnitsComponent } from './units/units.component';
import { VarriantAttributesComponent } from './varriant-attributes/varriant-attributes.component';
import { QrcodeComponent } from './qrcode/qrcode.component';
import { TagInputModule } from 'ngx-chips';




@NgModule({
  declarations: [
    InventoryComponent,
    BarcodeComponent,
    WarrantyComponent,
    BrandListComponent,
    UnitsComponent,
    VarriantAttributesComponent,
    QrcodeComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    sharedModule,
    TagInputModule
  ]
})
export class InventoryModule { }
