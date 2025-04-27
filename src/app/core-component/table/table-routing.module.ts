import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'tables-basic', pathMatch: 'full' },
  {
    path: '',
    children: [ 
  {
    path: 'tables-basic',
    loadChildren: () =>
      import('./tables-basic/tables-basic.module').then(
        (m) => m.TablesBasicModule
      ),
  },
  {
    path: 'data-basic',
    loadChildren: () =>
      import('./data-tables/data-tables.module').then(
        (m) => m.DataTableSModule
      ),
  },
],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TableRoutingModule {}
