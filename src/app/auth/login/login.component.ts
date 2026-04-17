import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../service/auth.service';
import { SesionesService } from '../../pages/apps/ventas/service/sesiones.service';
import { ConfigurationService } from '../service/configuration.service';
import { BitacoraUsuarioService } from '../../pages/apps/usuario/gestion-usuarios/service/bitacora-usuario.service';
import { UsuarioPerfilService } from '../service/usuario-perfil.service';
import { finalize, switchMap, map, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'vex-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatCheckboxModule,
    RouterLink,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class LoginComponent {
  private readonly defaultRedirectUrl = '/apps/tickets';
  private readonly previousReloginUrlKey = 'url-previous-relogin';
  private readonly previousReloginUserKey = 'user-previous-relogin';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  passwordInputType: string = 'text';
  visible = false;
  loading = false;
  readonly fieldId = Math.random().toString(36).substring(7);

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private sesionesService: SesionesService,
    private configurationService: ConfigurationService,
    private bitacoraUsuarioService: BitacoraUsuarioService,
    private usuarioPerfilService: UsuarioPerfilService
  ) {}

  onPasswordFocus(event: any): void {
    event.target.removeAttribute('readonly');
    if (this.passwordInputType === 'text') {
      this.passwordInputType = 'password';
      this.cd.markForCheck();
    }
  }

  onPasswordInput(event: any): void {
    event.target.removeAttribute('readonly');
    if (this.passwordInputType === 'text') {
      this.passwordInputType = 'password';
      this.cd.markForCheck();
    }
  }

  send() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.cd.markForCheck();

    const { email, password } = this.form.value;

    this.authService
      .login({
        correoElectronico: email!,
        contrasena: password!
      })
      .pipe(
        switchMap(() => {
          const cookie = this.sesionesService.generarCookieUnico();
          return this.sesionesService.crearSesion(cookie);
        }),
        switchMap((sesion) => {
          localStorage.setItem('session-id', sesion.id.toString());

          const config$ = this.configurationService
            .obtenerTodasConfiguraciones()
            .pipe(
              catchError((error) => {
                console.warn(
                  'No se pudieron obtener las configuraciones:',
                  error
                );
                return of(null);
              })
            );

          const perfil$ = this.usuarioPerfilService.getMyProfile().pipe(
            map((result) => {
              if (result && result.length > 0 && result[0].personalizacion) {
                localStorage.setItem(
                  'configuraciones-personales',
                  JSON.stringify(result[0].personalizacion)
                );
              }
              return result;
            }),
            catchError((error) => {
              console.warn('No se pudo obtener el perfil de usuario:', error);
              return of(null);
            })
          );

          const todosUsuarios$ = this.authService
            .cargarTodosUsuariosEnStorage()
            .pipe(
              catchError((error) => {
                console.warn(
                  'No se pudo obtener la caché de todos los usuarios:',
                  error
                );
                return of(null);
              })
            );

          return forkJoin([config$, perfil$, todosUsuarios$]).pipe(
            map(() => sesion)
          );
        }),
        switchMap((sesion) => {
          return this.bitacoraUsuarioService
            .registrarEventoInicioSesion(sesion.id)
            .pipe(
              catchError((error) => {
                console.warn(
                  'No se pudo registrar el evento de inicio de sesión en bitácora:',
                  error
                );
                return of(null);
              })
            );
        }),
        finalize(() => {
          this.loading = false;
          this.cd.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          const redirectUrl = this.resolvePostLoginUrl();

          this.snackbar.open('Inicio de sesión exitoso', 'Cerrar', {
            duration: 3000
          });
          void this.router.navigateByUrl(redirectUrl);
        },
        error: (error) => {
          let mensaje = 'Error al iniciar sesión';

          if (error.error) {
            mensaje =
              error.error.mensaje ||
              error.error.message ||
              error.error.error ||
              (typeof error.error === 'string' ? error.error : mensaje);
          } else if (error.message) {
            mensaje = error.message;
          }

          this.snackbar.open(mensaje, 'Cerrar', {
            duration: 7000,
            panelClass: ['alert-danger', 'snackbar-error'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
  }

  private resolvePostLoginUrl(): string {
    const previousUrl = localStorage.getItem(this.previousReloginUrlKey);
    const previousUser = localStorage.getItem(this.previousReloginUserKey);
    const currentUser = localStorage.getItem('user-nombre');

    const shouldRestorePreviousUrl =
      !!previousUrl && this.isSameUser(previousUser, currentUser);

    this.clearPreviousReloginState();

    return shouldRestorePreviousUrl ? previousUrl! : this.defaultRedirectUrl;
  }

  private isSameUser(
    previousUser: string | null,
    currentUser: string | null
  ): boolean {
    if (!previousUser || !currentUser) {
      return false;
    }

    return (
      this.normalizeUserName(previousUser) ===
      this.normalizeUserName(currentUser)
    );
  }

  private normalizeUserName(userName: string): string {
    return userName.trim().toLowerCase();
  }

  private clearPreviousReloginState(): void {
    localStorage.removeItem(this.previousReloginUrlKey);
    localStorage.removeItem(this.previousReloginUserKey);
  }

  toggleVisibility() {
    if (this.visible) {
      this.passwordInputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    } else {
      this.passwordInputType = 'text';
      this.visible = true;
      this.cd.markForCheck();
    }
  }
}
