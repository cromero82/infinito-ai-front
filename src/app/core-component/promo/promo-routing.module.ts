import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PromoComponent } from './promo.component';

const routes: Routes = [
  { path: '', component: PromoComponent ,children:[{
    path: 'coupons',
    loadChildren: () =>
      import('./coupons/coupons.module').then((m) => m.CouponsModule),
  },
  { path: 'gift-cards', loadChildren: () => import('./gift-cards/gift-cards.module').then(m => m.GiftCardsModule) },
  { path: 'discount', loadChildren: () => import('./discount/discount.module').then(m => m.DiscountModule) },
  { path: 'discount-plan', loadChildren: () => import('./discount-plan/discount-plan.module').then(m => m.DiscountPlanModule) },
]},

  
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PromoRoutingModule {}
