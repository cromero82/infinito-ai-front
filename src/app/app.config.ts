import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { frontendMonitorInterceptor } from './core/monitoring/frontend-monitor.interceptor';
import { bugReporterInterceptor } from './core/bug-reporter/bug-reporter.interceptor';
import { FrontendMonitorErrorHandler } from './core/monitoring/frontend-monitor.error-handler';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideIcons } from './core/icons/icons.provider';
import { provideLuxon } from './core/luxon/luxon.provider';
import { provideVex } from '@vex/vex.provider';
import { provideNavigation } from './core/navigation/navigation.provider';
import { vexConfigs } from '@vex/config/vex-configs';
import { provideQuillConfig } from 'ngx-quill';
import { provideMaterialDateDDMMYYYY } from './core/material/material-date-ddmmyyyy';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: FrontendMonitorErrorHandler },
    ...provideMaterialDateDDMMYYYY(),
    importProvidersFrom(
      BrowserModule,
      MatDialogModule,
      MatBottomSheetModule,
      MatNativeDateModule,
      MatSnackBarModule
    ),
    provideRouter(
      appRoutes,
      // TODO: Add preloading withPreloading(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([authInterceptor, frontendMonitorInterceptor, bugReporterInterceptor])
    ),

    provideVex({
      /**
       * The config that will be used by default.
       * This can be changed at runtime via the config panel or using the VexConfigService.
       */
      config: vexConfigs.ikaros,
      /**
       * Only themes that are available in the config in tailwind.config.ts should be listed here.
       * Any theme not listed here will not be available in the config panel.
       */
      availableThemes: [
        {
          name: 'Predeterminado',
          className: 'vex-theme-default'
        },
        {
          name: 'Verde azulado',
          className: 'vex-theme-teal'
        },
        {
          name: 'Verde',
          className: 'vex-theme-green'
        },
        {
          name: 'Morado',
          className: 'vex-theme-purple'
        },
        {
          name: 'Rojo',
          className: 'vex-theme-red'
        },
        {
          name: 'Naranja',
          className: 'vex-theme-orange'
        }
      ]
    }),
    provideNavigation(),
    provideIcons(),
    provideLuxon(),
    provideQuillConfig({
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['clean'],
          ['link', 'image']
        ]
      }
    })
  ]
};
