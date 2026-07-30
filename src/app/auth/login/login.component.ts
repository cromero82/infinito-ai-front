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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CorteVentaService } from '../../pages/apps/ventas/service/corte-venta.service';
import {
  DistribucionEfectivoDialogComponent,
  DistribucionEfectivoDialogResult
} from '../../pages/apps/financiero/ingresos/distribucion-efectivo-dialog/distribucion-efectivo-dialog.component';
import {
  BaseInicialDialogComponent,
  BaseInicialDialogResult
} from '../../pages/apps/financiero/ingresos/base-inicial-dialog/base-inicial-dialog.component';

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
    MatProgressSpinnerModule,
    MatDialogModule
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

  /** Alineado con `visible`: oculta = password, muestra = text. */
  passwordInputType: 'password' | 'text' = 'password';
  visible = false;
  loading = false;

  /** Correos usados en inicios exitosos (este navegador); sugeridos vía datalist. */
  recentEmails: string[] = [];
  readonly recentEmailsDatalistId = 'login-recent-emails-datalist';

  private static readonly RECENT_EMAILS_STORAGE_KEY = 'login-recent-emails';
  private static readonly RECENT_EMAILS_MAX = 30;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private sesionesService: SesionesService,
    private configurationService: ConfigurationService,
    private bitacoraUsuarioService: BitacoraUsuarioService,
    private usuarioPerfilService: UsuarioPerfilService,
    private dialog: MatDialog,
    private corteVentaService: CorteVentaService
  ) {
    this.loadRecentEmailsFromStorage();
  }

  onPasswordFocus(event: Event): void {
    const el = event.target as HTMLInputElement;
    el.removeAttribute('readonly');
    if (this.passwordInputType === 'text') {
      this.passwordInputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    }
  }

  onPasswordInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    el.removeAttribute('readonly');
    if (this.passwordInputType === 'text') {
      this.passwordInputType = 'password';
      this.visible = false;
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
          this.rememberSuccessfulLoginEmail(email!);

          const redirectUrl = this.resolvePostLoginUrl();

          this.snackbar.open('Inicio de sesión exitoso', 'Cerrar', {
            duration: 3000
          });

          if (this.authService.isAdmin()) {
            this.corteVentaService.obtenerDistribucionPendiente()
              .pipe(catchError(() => of({ pendiente: false as const })))
              .subscribe((pendiente) => {
                if (pendiente?.pendiente) {
                  this.abrirDistribucionPostLogin(redirectUrl);
                  return;
                }
                this.corteVentaService
                  .obtenerBaseInicialPendiente()
                  .pipe(catchError(() => of({ pendiente: false as const })))
                  .subscribe((baseIni) => {
                    if (baseIni?.pendiente) {
                      this.abrirBaseInicialPostLogin(redirectUrl);
                      return;
                    }
                    void this.router.navigateByUrl(redirectUrl);
                  });
              });
            return;
          }

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

  private abrirDistribucionPostLogin(redirectUrl: string): void {
    this.corteVentaService.obtenerDistribucionPendiente().subscribe({
      next: (pendiente) => {
        if (!pendiente?.pendiente) {
          void this.router.navigateByUrl(redirectUrl);
          return;
        }
        this.dialog
          .open(DistribucionEfectivoDialogComponent, {
            width: '520px',
            disableClose: true,
            data: { pendiente }
          })
          .afterClosed()
          .subscribe((res: DistribucionEfectivoDialogResult | undefined) => {
            if (res?.confirmada) {
              void this.router.navigateByUrl(redirectUrl);
              return;
            }
            // Cancelar / definir luego → logout
            this.forzarLogoutPostLogin(
              'Debe completar la Distribución de efectivo para continuar.'
            );
          });
      },
      error: () => void this.router.navigateByUrl(redirectUrl)
    });
  }

  private abrirBaseInicialPostLogin(redirectUrl: string): void {
    this.corteVentaService.obtenerBaseInicialPendiente().subscribe({
      next: (pendiente) => {
        if (!pendiente?.pendiente) {
          void this.router.navigateByUrl(redirectUrl);
          return;
        }
        this.dialog
          .open(BaseInicialDialogComponent, {
            width: '480px',
            disableClose: true,
            data: { pendiente }
          })
          .afterClosed()
          .subscribe((res: BaseInicialDialogResult | undefined) => {
            if (res?.confirmada) {
              void this.router.navigateByUrl(redirectUrl);
              return;
            }
            this.forzarLogoutPostLogin(
              'Debe registrar la inversión inicial (Base de caja) para continuar.'
            );
          });
      },
      error: () => void this.router.navigateByUrl(redirectUrl)
    });
  }

  private forzarLogoutPostLogin(mensaje: string): void {
    const sessionId = localStorage.getItem('session-id');
    const idNum = sessionId ? Number(sessionId) : NaN;
    const fin$ = Number.isFinite(idNum)
      ? this.sesionesService.deleteSesion(idNum).pipe(catchError(() => of(null)))
      : of(null);
    fin$.subscribe(() => {
      localStorage.removeItem('session-id');
      this.authService.logout();
      this.snackbar.open(mensaje, 'Cerrar', { duration: 5000 });
      this.cd.markForCheck();
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

  toggleVisibility(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (this.visible) {
      this.passwordInputType = 'password';
      this.visible = false;
    } else {
      this.passwordInputType = 'text';
      this.visible = true;
    }
    this.cd.markForCheck();
  }

  private loadRecentEmailsFromStorage(): void {
    try {
      const raw = localStorage.getItem(
        LoginComponent.RECENT_EMAILS_STORAGE_KEY
      );
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      this.recentEmails = Array.isArray(parsed)
        ? parsed.filter((e): e is string => typeof e === 'string' && e.length > 0)
        : [];
    } catch {
      this.recentEmails = [];
    }
  }

  private rememberSuccessfulLoginEmail(email: string): void {
    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }
    const lower = trimmed.toLowerCase();
    const next = [
      trimmed,
      ...this.recentEmails.filter((e) => e.toLowerCase() !== lower)
    ].slice(0, LoginComponent.RECENT_EMAILS_MAX);
    this.recentEmails = next;
    try {
      localStorage.setItem(
        LoginComponent.RECENT_EMAILS_STORAGE_KEY,
        JSON.stringify(this.recentEmails)
      );
    } catch {
      /* ignore quota / private mode */
    }
    this.cd.markForCheck();
  }
}
