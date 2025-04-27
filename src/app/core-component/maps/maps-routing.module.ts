import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapsComponent } from './maps.component';

const routes: Routes = [{ path: '', component: MapsComponent, children:[{ path: 'leaflets', loadChildren: () => import('./leaflet/leaflet.module').then(m => m.LeafletModule) }] }, ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapsRoutingModule { }
