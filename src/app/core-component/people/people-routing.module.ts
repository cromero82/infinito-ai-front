import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PeopleComponent } from './people.component';
import { CustomersComponent } from './customers/customers.component';
import { StoreListComponent } from './store-list/store-list.component';
import { WarehouseComponent } from './warehouse/warehouse.component';
import { SuppliersComponent } from './suppliers/suppliers.component';

const routes: Routes = [
  {
    path: '',
    component: PeopleComponent,
    children: [{ path: 'customers', component: CustomersComponent },
    { path: 'store-list', component: StoreListComponent},
    { path: 'warehouse', component:WarehouseComponent},
    { path: 'suppliers-list', component:SuppliersComponent},
    { path: 'billers', loadChildren: () => import('./billers/billers.module').then(m => m.BillersModule) },
  ],
    
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PeopleRoutingModule {}
