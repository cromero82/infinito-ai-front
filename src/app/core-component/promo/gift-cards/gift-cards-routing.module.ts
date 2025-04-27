import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GiftCardsComponent } from './gift-cards.component';

const routes: Routes = [{ path: '', component: GiftCardsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GiftCardsRoutingModule { }
