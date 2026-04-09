import { LayoutComponent } from './layouts/layout/layout.component';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';

export const appRoutes: VexRoutes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then(
        (m) => m.RegisterComponent
      )
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      )
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'apps/ventas',
        pathMatch: 'full'
      },
      {
        path: 'apps',
        children: [
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
        path: '**',
        redirectTo: 'apps/ventas'
      }
    ]
  }
];
