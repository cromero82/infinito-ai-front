import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlogCommentsComponent } from './blog-comments.component';

const routes: Routes = [{ path: '', component: BlogCommentsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogCommentsRoutingModule { }
