import { LayoutComponent } from './layouts/layout/layout.component';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';

export const appRoutes: VexRoutes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/pages/auth/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/pages/auth/register/register.component').then(
        (m) => m.RegisterComponent
      )
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(
        './pages/pages/auth/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'coming-soon',
    loadComponent: () =>
      import('./pages/pages/coming-soon/coming-soon.component').then(
        (m) => m.ComingSoonComponent
      )
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboards/analytics',
        redirectTo: '/',
        pathMatch: 'full'
      },
      {
        path: '',
        loadComponent: () =>
          import(
            './pages/dashboards/dashboard-analytics/dashboard-analytics.component'
          ).then((m) => m.DashboardAnalyticsComponent)
      },
      {
        path: 'apps',
        children: [
          {
            path: 'chat',
            loadChildren: () => import('./pages/apps/chat/chat.routes')
          },
          {
            path: 'mail',
            loadChildren: () => import('./pages/apps/mail/mail.routes'),
            data: {
              toolbarShadowEnabled: true,
              scrollDisabled: true
            }
          },
          {
            path: 'contacts',
            loadChildren: () => import('./pages/apps/contacts/contacts.routes')
          },
          {
            path: 'calendar',
            loadComponent: () =>
              import('./pages/apps/calendar/calendar.component').then(
                (m) => m.CalendarComponent
              ),
            data: {
              toolbarShadowEnabled: true
            }
          },
          {
            path: 'aio-table',
            loadComponent: () =>
              import('./pages/apps/aio-table/aio-table.component').then(
                (m) => m.AioTableComponent
              ),
            data: {
              toolbarShadowEnabled: false
            }
          },
          {
            path: 'help-center',
            loadChildren: () =>
              import('./pages/apps/help-center/help-center.routes')
          },
          {
            path: 'scrumboard',
            loadChildren: () =>
              import('./pages/apps/scrumboard/scrumboard.routes')
          },
          {
            path: 'editor',
            loadComponent: () =>
              import('./pages/apps/editor/editor.component').then(
                (m) => m.EditorComponent
              ),
            data: {
              scrollDisabled: true
            }
          },
          {
            path: 'products',
            children: [
              {
                path: 'admin-productos',
                loadComponent: () =>
                  import('./pages/apps/products/admin-productos/admin-productos.component').then(
                    (m) => m.AdminProductosComponent
                  ),
                data: { scrollDisabled: true }
              }
            ]
          },
          {
            path: 'ventas',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/apps/ventas/tickets-recibo/tickets-recibo.component').then(
                    (m) => m.TicketsReciboComponent
                  ),
                data: { scrollDisabled: true }
              },
              {
                path: 'historial',
                loadComponent: () =>
                  import('./pages/apps/ventas/historial-ventas/historial-ventas.component').then(
                    (m) => m.HistorialVentasComponent
                  ),
                data: { scrollDisabled: true }
              },
            ]
          },
          {
            path: 'user-profile',
            loadComponent: () =>
              import('./pages/apps/usuario/usuario.component').then(
                (m) => m.UsuarioComponent
              ),
            children: [
              {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                  import('./pages/apps/usuario/mi-perfil-usuario/mi-perfil-usuario.component').then(
                    (m) => m.MiPerfilUsuarioComponent
                  )
              },
              {
                path: 'actividad',
                loadComponent: () =>
                  import('./pages/apps/usuario/mi-usuario-actividades/mi-usuario-actividades.component').then(
                    (m) => m.MiUsuarioActividadesComponent
                  )
              },
              {
                path: 'preferencias',
                loadComponent: () =>
                  import('./pages/apps/usuario/mi-perfil-preferencias/mi-perfil-preferencias.component').then(
                    (m) => m.MiPerfilPreferenciasComponent
                  )
              }
            ]
          },
          {
            path: 'gestion-usuarios',
            loadChildren: () =>
              import('./pages/apps/usuario/gestion-usuarios/gestion-usuarios.routes')
          },
          {
            path: 'cargue-productos',
            loadComponent: () =>
              import('./pages/apps/cargue-productos/cargue-productos.component').then(
                (m) => m.CargueProductosComponent
              )
          },
          {
            path: 'master',
            loadComponent: () => import('./pages/apps/master-background/multiple-component-container.component').then(
              (m) => m.MultipleComponentContainerComponent
            )
          },
          {
            path: 'clientes',
            children: [
              {
                path: 'list',
                loadComponent: () =>
                  import('./pages/apps/clientes/cliente-list/cliente-list.component').then(
                    (m) => m.ClienteListComponent
                  ),
                data: { scrollDisabled: true }
              }
            ]
          },
          {
            path: 'financiero',
            loadComponent: () =>
              import('./pages/apps/financiero/financiero.component').then(
                (m) => m.FinancieroComponent
              ),
            children: [
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'ingresos'
              },
              {
                path: 'egresos',
                loadComponent: () =>
                  import('./pages/apps/financiero/egresos/egreso-list/egreso-list.component').then(
                    (m) => m.EgresoListComponent
                  ),
                data: { scrollDisabled: true }
              },
              {
                path: 'proveedores',
                loadComponent: () =>
                  import('./pages/apps/financiero/proveedores/proveedor-list/proveedor-list.component').then(
                    (m) => m.ProveedorListComponent
                  ),
                data: { scrollDisabled: true }
              },
              {
                path: 'resumen-economico',
                loadComponent: () =>
                  import(
                    './pages/apps/financiero/resumen-economico/resumen-economico-list/resumen-economico-list.component'
                  ).then((m) => m.ResumenEconomicoListComponent),
                data: { scrollDisabled: true }
              },
              {
                path: 'ingresos',
                loadComponent: () =>
                  import('./pages/apps/financiero/ingresos/ingresos.component').then(
                    (m) => m.IngresosComponent
                  ),
                data: { scrollDisabled: true }
              }
            ]
          },
          {
            path: 'tipos',
            loadChildren: () => import('./pages/apps/tipos/tipos.routes')
          },
        ]
      },
      {
        path: 'pages',
        children: [
          {
            path: 'pricing',
            loadComponent: () =>
              import('./pages/pages/pricing/pricing.component').then(
                (m) => m.PricingComponent
              )
          },
          {
            path: 'faq',
            loadComponent: () =>
              import('./pages/pages/faq/faq.component').then(
                (m) => m.FaqComponent
              )
          },
          {
            path: 'guides',
            loadComponent: () =>
              import('./pages/pages/guides/guides.component').then(
                (m) => m.GuidesComponent
              )
          },
          {
            path: 'invoice',
            loadComponent: () =>
              import('./pages/pages/invoice/invoice.component').then(
                (m) => m.InvoiceComponent
              )
          },
          {
            path: 'error-404',
            loadComponent: () =>
              import('./pages/pages/errors/error-404/error-404.component').then(
                (m) => m.Error404Component
              )
          },
          {
            path: 'error-500',
            loadComponent: () =>
              import('./pages/pages/errors/error-500/error-500.component').then(
                (m) => m.Error500Component
              )
          }
        ]
      },
      {
        path: 'ui',
        children: [
          {
            path: 'components',
            loadChildren: () =>
              import('./pages/ui/components/components.routes')
          },
          {
            path: 'forms/form-elements',
            loadComponent: () =>
              import(
                './pages/ui/forms/form-elements/form-elements.component'
              ).then((m) => m.FormElementsComponent)
          },
          {
            path: 'forms/form-wizard',
            loadComponent: () =>
              import('./pages/ui/forms/form-wizard/form-wizard.component').then(
                (m) => m.FormWizardComponent
              )
          },
          {
            path: 'icons',
            loadChildren: () => import('./pages/ui/icons/icons.routes')
          },
          {
            path: 'page-layouts',
            loadChildren: () =>
              import('./pages/ui/page-layouts/page-layouts.routes')
          }
        ]
      },
      {
        path: 'documentation',
        loadChildren: () => import('./pages/documentation/documentation.routes')
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/pages/errors/error-404/error-404.component').then(
            (m) => m.Error404Component
          )
      }
    ]
  }
];
