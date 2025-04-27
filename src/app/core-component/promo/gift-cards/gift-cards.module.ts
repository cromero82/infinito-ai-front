import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GiftCardsRoutingModule } from './gift-cards-routing.module';
import { GiftCardsComponent } from './gift-cards.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    GiftCardsComponent
  ],
  imports: [
    CommonModule,
    GiftCardsRoutingModule,
    sharedModule
  ]
})
export class GiftCardsModule { }
