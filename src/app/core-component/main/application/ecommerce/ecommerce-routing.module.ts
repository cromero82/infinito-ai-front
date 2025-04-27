import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EcommerceComponent } from './ecommerce.component';

const routes: Routes = [
  { path: '',
     component: EcommerceComponent,
     children:[

       { path: 'products', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },
       { path: 'orders', loadChildren: () => import('./orders/orders.module').then(m => m.OrdersModule) }, 
       { path: 'customers', loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule) },
       { path: 'cart', loadChildren: () => import('./cart/cart.module').then(m => m.CartModule) },
       { path: 'checkout', loadChildren: () => import('./checkout/checkout.module').then(m => m.CheckoutModule) },
       { path: 'wishlist', loadChildren: () => import('./wishlist/wishlist.module').then(m => m.WishlistModule) },
       { path: 'reviews', loadChildren: () => import('./reviews/reviews.module').then(m => m.ReviewsModule) },
     ]
     },
    ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EcommerceRoutingModule { }
