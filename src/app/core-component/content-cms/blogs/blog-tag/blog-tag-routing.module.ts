import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlogTagComponent } from './blog-tag.component';

const routes: Routes = [{ path: '', component: BlogTagComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogTagRoutingModule { }
