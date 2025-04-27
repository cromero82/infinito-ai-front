import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UiAccordionComponent } from './ui-accordion.component';

const routes: Routes = [{ path: '', component: UiAccordionComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UiAccordionRoutingModule { }
