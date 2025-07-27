import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./tipos-table/tipos-table.component').then(m => m.TiposTableComponent)
  }
] as Routes; 