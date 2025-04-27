import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContentCmsRoutingModule } from './content-cms-routing.module';
import { ContentCmsComponent } from './content-cms.component';


@NgModule({
  declarations: [
    ContentCmsComponent
  ],
  imports: [
    CommonModule,
    ContentCmsRoutingModule
  ]
})
export class ContentCmsModule { }
