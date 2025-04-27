import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignaturesComponent } from './signatures.component';

const routes: Routes = [{ path: '', component: SignaturesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SignaturesRoutingModule { }
