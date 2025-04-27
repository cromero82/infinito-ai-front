import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PeopleRoutingModule } from './people-routing.module';
import { PeopleComponent } from './people.component';
import { CustomersComponent } from './customers/customers.component';
import { StoreListComponent } from './store-list/store-list.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { sharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    PeopleComponent,
    CustomersComponent,
    StoreListComponent,
    SuppliersComponent,
    WarehouseComponent
    
  ],
  imports: [
    CommonModule,
    PeopleRoutingModule,
    sharedModule
  ]
})
export class PeopleModule { }
