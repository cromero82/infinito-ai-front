import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmailTemplatesRoutingModule } from './email-templates-routing.module';
import { EmailTemplatesComponent } from './email-templates.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    EmailTemplatesComponent
  ],
  imports: [
    CommonModule,
    EmailTemplatesRoutingModule,
    sharedModule
  ]
})
export class EmailTemplatesModule { }
