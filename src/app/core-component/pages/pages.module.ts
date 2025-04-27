import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { UnderMaintenanceComponent } from './under-maintenance/under-maintenance.component';
import { ProfileComponent } from './profile/profile.component';
import { ActivitiesComponent } from './activities/activities.component';
import { BlankPageComponent } from './blank-page/blank-page.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { PricingComponent } from './pricing/pricing.component';

@NgModule({
  declarations: [
    PagesComponent,
    UnderMaintenanceComponent,
    ProfileComponent,
    ActivitiesComponent,
    BlankPageComponent,
    ComingSoonComponent,
    PricingComponent
  ],
  imports: [CommonModule, PagesRoutingModule, sharedModule],
})
export class PagesModule {}
