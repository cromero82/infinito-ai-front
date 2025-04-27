import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseUiComponent } from './base-ui.component';

const routes: Routes = [
  {
    path: '',
    component: BaseUiComponent,
    children: [
      {
        path: 'ui-sweetalerts',
        loadChildren: () =>
          import('./ui-sweetalerts/ui-sweetalerts.module').then(
            (m) => m.UiSweetalertsModule
          ),
      },
      {
        path: 'ui-spinner',
        loadChildren: () =>
          import('./ui-spinner/ui-spinner.module').then(
            (m) => m.UiSpinnerModule
          ),
      },
      {
        path: 'ui-rangeslider',
        loadChildren: () =>
          import('./ui-rangeslider/ui-rangeslider.module').then(
            (m) => m.UiRangesliderModule
          ),
      },
      {
        path: 'ui-progress',
        loadChildren: () =>
          import('./ui-progress/ui-progress.module').then(
            (m) => m.UiProgressModule
          ),
      },
      {
        path: 'ui-video',
        loadChildren: () =>
          import('./ui-video/ui-video.module').then((m) => m.UiVideoModule),
      },
      {
        path: 'ui-typography',
        loadChildren: () =>
          import('./ui-typography/ui-typography.module').then(
            (m) => m.UiTypographyModule
          ),
      },
      {
        path: 'ui-carousel',
        loadChildren: () =>
          import('./ui-carousel/ui-carousel.module').then(
            (m) => m.UiCarouselModule
          ),
      },
      {
        path: 'ui-cards',
        loadChildren: () =>
          import('./ui-cards/ui-cards.module').then((m) => m.UiCardsModule),
      },
      {
        path: 'ui-buttons-group',
        loadChildren: () =>
          import('./ui-buttons-group/ui-buttons-group.module').then(
            (m) => m.UiButtonsGroupModule
          ),
      },
      {
        path: 'ui-buttons',
        loadChildren: () =>
          import('./ui-buttons/ui-buttons.module').then(
            (m) => m.UiButtonsModule
          ),
      },
      {
        path: 'ui-breadcrumb',
        loadChildren: () =>
          import('./ui-breadcrumb/ui-breadcrumb.module').then(
            (m) => m.UiBreadcrumbModule
          ),
      },
      {
        path: 'ui-borders',
        loadChildren: () =>
          import('./ui-borders/ui-borders.module').then(
            (m) => m.UiBordersModule
          ),
      },
      {
        path: 'ui-badges',
        loadChildren: () =>
          import('./ui-badges/ui-badges.module').then((m) => m.UiBadgesModule),
      },
      {
        path: 'ui-accordion',
        loadChildren: () =>
          import('./ui-accordion/ui-accordion.module').then(
            (m) => m.UiAccordionModule
          ),
      },
      {
        path: 'ui-alerts',
        loadChildren: () =>
          import('./ui-alerts/ui-alerts.module').then((m) => m.UiAlertsModule),
      },
      {
        path: 'ui-avatar',
        loadChildren: () =>
          import('./ui-avatar/ui-avatar.module').then((m) => m.UiAvatarModule),
      },
      {
        path: 'ui-popovers',
        loadChildren: () =>
          import('./ui-popovers/ui-popovers.module').then(
            (m) => m.UiPopoversModule
          ),
      },
      {
        path: 'ui-placeholders',
        loadChildren: () =>
          import('./ui-placeholders/ui-placeholders.module').then(
            (m) => m.UiPlaceholdersModule
          ),
      },
      {
        path: 'ui-pagination',
        loadChildren: () =>
          import('./ui-pagination/ui-pagination.module').then(
            (m) => m.UiPaginationModule
          ),
      },
      {
        path: 'ui-offcanvas',
        loadChildren: () =>
          import('./ui-offcanvas/ui-offcanvas.module').then(
            (m) => m.UiOffcanvasModule
          ),
      },
      {
        path: 'ui-nav-tabs',
        loadChildren: () =>
          import('./ui-nav-tabs/ui-nav-tabs.module').then(
            (m) => m.UiNavTabsModule
          ),
      },
      {
        path: 'ui-modals',
        loadChildren: () =>
          import('./ui-modals/ui-modals.module').then((m) => m.UiModalsModule),
      },
      {
        path: 'ui-media',
        loadChildren: () =>
          import('./ui-media/ui-media.module').then((m) => m.UiMediaModule),
      },
      {
        path: 'ui-lightbox',
        loadChildren: () =>
          import('./ui-lightbox/ui-lightbox.module').then(
            (m) => m.UiLightboxModule
          ),
      },
      {
        path: 'ui-images',
        loadChildren: () =>
          import('./ui-images/ui-images.module').then((m) => m.UiImagesModule),
      },
      {
        path: 'ui-grid',
        loadChildren: () =>
          import('./ui-grid/ui-grid.module').then((m) => m.UiGridModule),
      },
      {
        path: 'ui-tooltips',
        loadChildren: () =>
          import('./ui-tooltips/ui-tooltips.module').then(
            (m) => m.UiTooltipsModule
          ),
      },
      {
        path: 'ui-toasts',
        loadChildren: () =>
          import('./ui-toasts/ui-toasts.module').then((m) => m.UiToastsModule),
      },
      {
        path: 'ui-dropdowns',
        loadChildren: () =>
          import('./ui-dropdowns/ui-dropdowns.module').then(
            (m) => m.UiDropdownsModule
          ),
      },
     
      {
        path: 'ui-colors',
        loadChildren: () =>
          import('./ui-colors/ui-colors.module').then((m) => m.UiColorsModule),
      },
      {
        path: 'ui-sortable',
        loadChildren: () =>
          import('./ui-sortable/ui-sortable.module').then(
            (m) => m.UiSortableModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BaseUiRoutingModule {}
