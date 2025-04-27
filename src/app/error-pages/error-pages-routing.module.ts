import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ErrorPagesComponent } from './error-pages.component';
import { Error500Component } from './error-500/error-500.component';

const routes: Routes = [
  {
    path: '',
    component: ErrorPagesComponent,
    children: [
      
      {
        path: 'error-500',
        component: Error500Component,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ErrorPagesRoutingModule {}
