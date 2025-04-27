import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableRoutingModule } from './table-routing.module';
import { TableComponent } from './table.component';
import { sharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [TableComponent],
  imports: [CommonModule, TableRoutingModule, sharedModule],
})
export class TableModule {}
