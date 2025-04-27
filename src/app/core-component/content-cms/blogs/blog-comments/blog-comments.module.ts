import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BlogCommentsRoutingModule } from './blog-comments-routing.module';
import { BlogCommentsComponent } from './blog-comments.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    BlogCommentsComponent
  ],
  imports: [
    CommonModule,
    BlogCommentsRoutingModule,
    sharedModule
  ]
})
export class BlogCommentsModule { }
