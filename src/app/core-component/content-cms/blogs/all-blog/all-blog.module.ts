import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipModule  } from 'primeng/chip';
import { AllBlogRoutingModule } from './all-blog-routing.module';
import { AllBlogComponent } from './all-blog.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { TagInputModule } from 'ngx-chips';

@NgModule({
  declarations: [
    AllBlogComponent
  ],
  imports: [
    CommonModule,
    AllBlogRoutingModule,
    sharedModule,
    ChipModule,
    TagInputModule
  ]
})
export class AllBlogModule { }
