import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'icon-fontawesome', pathMatch: 'full' },
  {
    path: '',
    children: [
      {
        path: 'icon-fontawesome',
        loadChildren: () =>
          import('./icon-fontawesome/icon-fontawesome.module').then(
            (m) => m.IconFontawesomeModule
          ),
      },
      {
        path: 'icon-feather',
        loadChildren: () =>
          import('./icon-feather/icon-feather.module').then(
            (m) => m.IconFeatherModule
          ),
      },
      {
        path: 'icon-ionic',
        loadChildren: () =>
          import('./icon-ionic/icon-ionic.module').then(
            (m) => m.IconIonicModule
          ),
      },
      {
        path: 'icon-material',
        loadChildren: () =>
          import('./icon-material/icon-material.module').then(
            (m) => m.IconMaterialModule
          ),
      },
      {
        path: 'icon-pe7',
        loadChildren: () =>
          import('./icon-pe7/icon-pe7.module').then((m) => m.IconPe7Module),
      },
      {
        path: 'icon-simpleline',
        loadChildren: () =>
          import('./icon-simpleline/icon-simpleline.module').then(
            (m) => m.IconSimplelineModule
          ),
      },
      {
        path: 'icon-themify',
        loadChildren: () =>
          import('./icon-themify/icon-themify.module').then(
            (m) => m.IconThemifyModule
          ),
      },
      {
        path: 'icon-weather',
        loadChildren: () =>
          import('./icon-weather/icon-weather.module').then(
            (m) => m.IconWeatherModule
          ),
      },
      {
        path: 'icon-typicon',
        loadChildren: () =>
          import('./icon-typicon/icon-typicon.module').then(
            (m) => m.IconTypiconModule
          ),
      },
      {
        path: 'icon-flag',
        loadChildren: () =>
          import('./icon-flag/icon-flag.module').then((m) => m.IconFlagModule),
      },
      { path: 'icon-bootstrap', loadChildren: () => import('./icon-bootstrap/icon-bootstrap.module').then(m => m.IconBootstrapModule) },
      { path: 'icon-remix', loadChildren: () => import('./icon-remix/icon-remix.module').then(m => m.IconRemixModule) },
      { path: 'icon-tabler', loadChildren: () => import('./icon-tabler/icon-tabler.module').then(m => m.IconTablerModule) },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IconsRoutingModule {}
