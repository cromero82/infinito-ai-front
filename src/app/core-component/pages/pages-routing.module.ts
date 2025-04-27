import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesComponent } from './pages.component';
import { BlankPageComponent } from './blank-page/blank-page.component';
import { UnderMaintenanceComponent } from './under-maintenance/under-maintenance.component';
import { ProfileComponent } from './profile/profile.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { ActivitiesComponent } from './activities/activities.component';
import { PricingComponent } from './pricing/pricing.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: 'blank-page',
        component: BlankPageComponent,
      },
      {
        path: 'under-maintenance',
        component: UnderMaintenanceComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'coming-soon',
        component: ComingSoonComponent,
      },
      {
        path: 'places',
        loadChildren: () =>
          import('./places/places.module').then((m) => m.PlacesModule),
      },
      {
        path: 'activities',
        component: ActivitiesComponent
      },
      {
        path: 'pricing',
        component: PricingComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
