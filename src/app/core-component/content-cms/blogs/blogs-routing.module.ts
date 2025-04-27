import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlogsComponent } from './blogs.component';

const routes: Routes = [
  { path: '', 
    component: BlogsComponent,
    children:[

      { path: 'all-blog', loadChildren: () => import('./all-blog/all-blog.module').then(m => m.AllBlogModule) }, 
      { path: 'blog-tag', loadChildren: () => import('./blog-tag/blog-tag.module').then(m => m.BlogTagModule) },
      { path: 'categories', loadChildren: () => import('./categories/categories.module').then(m => m.CategoriesModule) }, 
      { path: 'blog-comments', loadChildren: () => import('./blog-comments/blog-comments.module').then(m => m.BlogCommentsModule) }, 
      { path: 'blog-details', loadChildren: () => import('./blog-details/blog-details.module').then(m => m.BlogDetailsModule) }
    ]
   }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogsRoutingModule { }
