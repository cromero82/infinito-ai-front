import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlacesComponent } from './places.component';
import { CountriesComponent } from './countries/countries.component';
import { StatesComponent } from './states/states.component';

const routes: Routes = [
  {
    path: '',
    component: PlacesComponent,
    children: [
      {
        path: 'countries',
        component: CountriesComponent,
      },
      {
        path: 'states',
        component: StatesComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlacesRoutingModule {}
