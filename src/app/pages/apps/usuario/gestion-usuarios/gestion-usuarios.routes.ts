import { VexRoutes } from '@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    loadComponent: () =>
      import('./gestion-usuarios.component').then(
        (m) => m.GestionUsuariosComponent
      ),
    data: {
      toolbarShadowEnabled: true
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./usuario-monitoreo/usuario-monitoreo.component').then(
            (m) => m.UsuarioMonitoreoComponent
          )
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./usuario-roles/usuario-roles.component').then(
            (m) => m.UsuarioRolesComponent
          )
      }
    ]
  }
];

export default routes;

