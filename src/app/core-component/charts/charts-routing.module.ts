import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartsComponent } from './charts.component';
[BrowserModule, FormsModule, ReactiveFormsModule, NgApexchartsModule];

const routes: Routes = [
  { path: '', redirectTo: 'chart-apex', pathMatch: 'full' },
  {
    path: '',
    component: ChartsComponent,
    children: [
      {
        path: 'chart-apex',
        loadChildren: () =>
          import('./chart-apex/chart-apex.module').then(
            (m) => m.ChartApexModule
          ),
      },
      { 
        path: 'prime-ng', 
        loadChildren: () => 
        import('./prime-ng/prime-ng.module').
        then(
          (m) => m.PrimeNgModule) 
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChartsRoutingModule {}
