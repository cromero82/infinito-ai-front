import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { TreeSelectModule } from 'primeng/treeselect';


@NgModule({
  declarations: [
    PagesComponent
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    sharedModule,
    TreeSelectModule 
  ]
})
export class PagesModule { }
