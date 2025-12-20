import { UsuarioComponent } from './usuario.component';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: UsuarioComponent,
    data: {
      toolbarShadowEnabled: true
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./mi-perfil-usuario/mi-perfil-usuario.component').then(
            (m) => m.MiPerfilUsuarioComponent
          )
      }
    ]
  }
];

export default routes;
