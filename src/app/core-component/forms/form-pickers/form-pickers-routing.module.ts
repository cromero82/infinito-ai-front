import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormPickersComponent } from './form-pickers.component';

const routes: Routes = [{ path: '', component: FormPickersComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FormPickersRoutingModule { }
