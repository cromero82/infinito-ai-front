import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/service/auth.service';
import { catchError, throwError } from 'rxjs';

const PREVIOUS_RELOGIN_URL_KEY = 'url-previous-relogin';
const PREVIOUS_RELOGIN_USER_KEY = 'user-previous-relogin';
const TOKEN_EXPIRED_MESSAGE = 'El token ha expirado';
const MISSING_TOKEN_MESSAGE =
  'Missing token: use Authorization: Bearer <token> or token header';
const AUTH_SERVER_UNAVAILABLE_MESSAGE =
  'Invalid token or auth service unavailable';
const AUTH_SERVER_UNAVAILABLE_SNACKBAR_MESSAGE =
  'Revise si el servidor de autorizacion esta disponible y tiene conexion.';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  // Rutas que no requieren autenticación
  const excludedRoutes = [
    '/auth/login',
    '/auth/registro'
  ];

  // Obtener la URL completa
  const url = req.url;

  // Verificar si la URL contiene alguna de las rutas excluidas
  const shouldExclude = excludedRoutes.some(route => url.includes(route));

  // Obtener el token del localStorage
  const token = localStorage.getItem('user-token');

  const requestToSend =
    !shouldExclude && token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

  return next(requestToSend).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.error?.message ||
        error.error?.mensaje ||
        TOKEN_EXPIRED_MESSAGE;

      const normalizedMessage =
        typeof message === 'string' ? message.trim().toLowerCase() : '';
      const reloginMessages = [
        TOKEN_EXPIRED_MESSAGE.toLowerCase(),
        MISSING_TOKEN_MESSAGE.toLowerCase()
      ];
      const isAuthServerUnavailableError =
        error.status === 401 &&
        normalizedMessage === AUTH_SERVER_UNAVAILABLE_MESSAGE.toLowerCase();
      const shouldRedirectToLogin =
        error.status === 401 && reloginMessages.includes(normalizedMessage);

      if (shouldRedirectToLogin) {
        const currentUser = localStorage.getItem('user-nombre');

        if (router.url !== '/login') {
          localStorage.setItem(PREVIOUS_RELOGIN_URL_KEY, router.url);

          if (currentUser) {
            localStorage.setItem(PREVIOUS_RELOGIN_USER_KEY, currentUser);
          } else {
            localStorage.removeItem(PREVIOUS_RELOGIN_USER_KEY);
          }
        }

        authService.logout(true);
        snackBar.dismiss();
        snackBar.open(message, 'Cerrar', {
          duration: 7000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });

        if (router.url !== '/login') {
          void router.navigate(['/login']);
        }
      } else if (isAuthServerUnavailableError) {
        setTimeout(() => {
          snackBar.dismiss();
          snackBar.open(AUTH_SERVER_UNAVAILABLE_SNACKBAR_MESSAGE, 'Cerrar', {
            duration: 7000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }, 0);
      }

      return throwError(() => error);
    })
  );
};

