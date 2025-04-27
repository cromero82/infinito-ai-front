import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IconFontawesomeComponent } from './icon-fontawesome.component';

const routes: Routes = [{ path: '', component: IconFontawesomeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IconFontawesomeRoutingModule { }
