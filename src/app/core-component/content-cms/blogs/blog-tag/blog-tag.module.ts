import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BlogTagRoutingModule } from './blog-tag-routing.module';
import { BlogTagComponent } from './blog-tag.component';
import { sharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    BlogTagComponent
  ],
  imports: [
    CommonModule,
    BlogTagRoutingModule,
    sharedModule
  ]
})
export class BlogTagModule { }
