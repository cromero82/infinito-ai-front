import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContentCmsComponent } from './content-cms.component';

const routes: Routes = [
  { path: '', 
    component: ContentCmsComponent,
    children:[
      { path: 'pages', loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule) }, 
      { path: 'testimonial', loadChildren: () => import('./testimonial/testimonial.module').then(m => m.TestimonialModule) }, 
      { path: 'faq', loadChildren: () => import('./faq/faq.module').then(m => m.FaqModule) }, 
      { path: 'blogs', loadChildren: () => import('./blogs/blogs.module').then(m => m.BlogsModule) }, 
      { path: 'location', loadChildren: () => import('./location/location.module').then(m => m.LocationModule) }
    ]
   }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContentCmsRoutingModule { }
