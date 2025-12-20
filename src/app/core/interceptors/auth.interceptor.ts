import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Rutas que no requieren autenticación
  const excludedRoutes = [
    '/auth/login',
    '/auth/registro'
  ];

  // Obtener la URL completa
  const url = req.url;

  // Verificar si la URL contiene alguna de las rutas excluidas
  const shouldExclude = excludedRoutes.some(route => url.includes(route));

  // Si la ruta está excluida, no agregar el token
  if (shouldExclude) {
    return next(req);
  }

  // Obtener el token del localStorage
  const token = localStorage.getItem('user-token');

  // Si hay token, agregarlo al header
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  // Si no hay token, continuar con la petición original
  return next(req);
};

