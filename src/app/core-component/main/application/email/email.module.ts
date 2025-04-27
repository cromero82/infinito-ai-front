import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmailRoutingModule } from './email-routing.module';
import { EmailComponent } from './email.component';
import { sharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [EmailComponent],
  imports: [CommonModule, EmailRoutingModule, sharedModule],
})
export class EmailModule {}
