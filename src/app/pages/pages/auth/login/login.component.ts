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
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../service/auth.service';
import { SesionesService } from '../../../apps/ventas/service/sesiones.service';
import { ConfigurationService } from '../service/configuration.service';
import { BitacoraUsuarioService } from '../../../apps/usuario/gestion-usuarios/service/bitacora-usuario.service';
import { finalize, switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'vex-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
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
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  passwordInputType: string = 'text'; // Inicialmente texto para evitar detección de password
  visible = false;
  loading = false;
  readonly fieldId = Math.random().toString(36).substring(7); // ID único para confundir autocompletar

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private sesionesService: SesionesService,
    private configurationService: ConfigurationService,
    private bitacoraUsuarioService: BitacoraUsuarioService
  ) {}

  onPasswordFocus(event: any): void {
    event.target.removeAttribute('readonly');
    // Cambiar a password cuando el usuario hace focus
    if (this.passwordInputType === 'text') {
      this.passwordInputType = 'password';
      this.cd.markForCheck();
    }
  }

  onPasswordInput(event: any): void {
    event.target.removeAttribute('readonly');
    // Asegurar que sea password cuando el usuario empieza a escribir
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

    this.authService.login({
      correoElectronico: email!,
      contrasena: password!
    }).pipe(
      // Después del login exitoso, crear/obtener la sesión
      switchMap(() => {
        const cookie = this.sesionesService.generarCookieUnico();
        return this.sesionesService.crearSesion(cookie);
      }),
      // Después de crear la sesión, obtener las configuraciones
      switchMap((sesion) => {
        // Guardar el session-id en localStorage
        localStorage.setItem('session-id', sesion.id.toString());
        
        // Obtener configuraciones de la app (si falla, continuar de todas formas)
        return this.configurationService.obtenerTodasConfiguraciones().pipe(
          map(() => sesion), // Devolver la sesión después de obtener configuraciones
          catchError((error) => {
            // Si falla la obtención de configuraciones, continuar de todas formas
            console.warn('No se pudieron obtener las configuraciones:', error);
            return of(sesion); // Devolver la sesión para continuar el flujo
          })
        );
      }),
      // Después de obtener configuraciones, registrar el evento de inicio de sesión en bitácora
      switchMap(() => {
        return this.bitacoraUsuarioService.registrarEventoInicioSesion().pipe(
          catchError((error) => {
            // Si falla el registro de bitácora, continuar de todas formas (no bloquear el login)
            console.warn('No se pudo registrar el evento de inicio de sesión en bitácora:', error);
            return of(null); // Continuar el flujo
          })
        );
      }),
      finalize(() => {
        this.loading = false;
        this.cd.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.snackbar.open('Inicio de sesión exitoso', 'Cerrar', {
          duration: 3000
        });
        this.router.navigate(['/apps/ventas']);
      },
      error: (error) => {
        // Extraer el mensaje de error del servidor
        let mensaje = 'Error al iniciar sesión';
        
        if (error.error) {
          // Intentar diferentes campos donde puede estar el mensaje
          mensaje = error.error.mensaje || 
                   error.error.message || 
                   error.error.error || 
                   (typeof error.error === 'string' ? error.error : mensaje);
        } else if (error.message) {
          mensaje = error.message;
        }

        // Mostrar alerta tipo Bootstrap (roja/danger)
        this.snackbar.open(mensaje, 'Cerrar', {
          duration: 7000,
          panelClass: ['alert-danger', 'snackbar-error'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
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
