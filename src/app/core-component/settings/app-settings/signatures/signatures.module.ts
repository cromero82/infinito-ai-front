import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SignaturesRoutingModule } from './signatures-routing.module';
import { SignaturesComponent } from './signatures.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    SignaturesComponent
  ],
  imports: [
    CommonModule,
    SignaturesRoutingModule,
    sharedModule
  ]
})
export class SignaturesModule { }
