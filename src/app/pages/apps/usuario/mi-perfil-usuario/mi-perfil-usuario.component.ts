import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../pages/auth/service/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'gm-mi-perfil-usuario',
  templateUrl: './mi-perfil-usuario.component.html',
  styleUrls: ['./mi-perfil-usuario.component.scss'],
  animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms],
  standalone: true,
  imports: [
    MatIconModule, 
    NgFor, 
    NgIf, 
    MatButtonModule, 
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    FormsModule,
    MatSnackBarModule
  ]
})
export class MiPerfilUsuarioComponent implements OnInit {
  nombreUsuario: string | null = null;
  correoUsuario: string | null = null;
  telefonoUsuario: string | null = null;
  rolNombre: string | null = null;
  passwordOculto: string = '••••••••'; // Password oculto (no se trae del backend por seguridad)

  // Valores originales para comparar cambios
  nombreOriginal: string = '';
  correoOriginal: string = '';
  telefonoOriginal: string = '';
  passwordOriginal: string = '';

  // Valores editados
  nombreEditado: string = '';
  correoEditado: string = '';
  telefonoEditado: string = '';
  passwordEditado: string = '';

  modoEdicion: boolean = false;
  actualizando: boolean = false;
  passwordInputType: string = 'text'; // Inicialmente texto para evitar detección de password
  readonly fieldId = Math.random().toString(36).substring(7); // ID único para confundir autocompletar

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.nombreUsuario = this.authService.getNombre();
    this.rolNombre = this.authService.getRolNombre();
    
    // Obtener correo del token decodificado
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = this.decodeJwt(token);
        this.correoUsuario = payload.sub || null;
        this.telefonoUsuario = payload.telefono || null;
        
        // Guardar valores originales
        this.nombreOriginal = this.nombreUsuario || '';
        this.correoOriginal = this.correoUsuario || '';
        this.telefonoOriginal = this.telefonoUsuario || '';
        
        // Inicializar valores editados con los originales
        this.nombreEditado = this.nombreOriginal;
        this.correoEditado = this.correoOriginal;
        this.telefonoEditado = this.telefonoOriginal;
        this.passwordEditado = '';
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    }
  }

  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.passwordInputType = 'text'; // Resetear a texto
    // Reiniciar valores editados con los originales
    this.nombreEditado = this.nombreOriginal;
    this.correoEditado = this.correoOriginal;
    this.telefonoEditado = this.telefonoOriginal;
    this.passwordEditado = '';
    
    // Cambiar tipo después de un pequeño delay para evitar detección
    setTimeout(() => {
      this.passwordInputType = 'password';
      this.cd.markForCheck();
    }, 100);
  }

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

  cancelarEdicion(): void {
    this.modoEdicion = false;
    // Restaurar valores originales
    this.nombreEditado = this.nombreOriginal;
    this.correoEditado = this.correoOriginal;
    this.telefonoEditado = this.telefonoOriginal;
    this.passwordEditado = '';
  }

  actualizarUsuario(): void {
    // Crear objeto con solo los campos modificados
    const datosActualizados: any = {};
    let hayCambios = false;

    if (this.nombreEditado !== this.nombreOriginal && this.nombreEditado.trim() !== '') {
      datosActualizados.nombre = this.nombreEditado.trim();
      hayCambios = true;
    }

    if (this.correoEditado !== this.correoOriginal && this.correoEditado.trim() !== '') {
      datosActualizados.correoElectronico = this.correoEditado.trim();
      hayCambios = true;
    }

    if (this.telefonoEditado !== this.telefonoOriginal && this.telefonoEditado.trim() !== '') {
      datosActualizados.telefono = this.telefonoEditado.trim();
      hayCambios = true;
    }

    if (this.passwordEditado && this.passwordEditado.trim() !== '') {
      datosActualizados.contrasena = this.passwordEditado.trim();
      hayCambios = true;
    }

    if (!hayCambios) {
      this.snackBar.open('No se han realizado cambios', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.actualizando = true;
    this.cd.markForCheck();

    this.authService.actualizarUsuario(datosActualizados)
      .pipe(
        finalize(() => {
          this.actualizando = false;
          this.cd.markForCheck();
        }),
        catchError(error => {
          console.error('Error al actualizar usuario:', error);
          const mensajeError = error?.error?.message || error?.message || 'Error al actualizar usuario';
          this.snackBar.open(mensajeError, 'Cerrar', {
            duration: 5000
          });
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          // Actualizar valores originales con los nuevos
          if (datosActualizados.nombre) {
            this.nombreOriginal = datosActualizados.nombre;
            this.nombreUsuario = datosActualizados.nombre;
            localStorage.setItem('user-nombre', datosActualizados.nombre);
          }
          if (datosActualizados.correoElectronico) {
            this.correoOriginal = datosActualizados.correoElectronico;
            this.correoUsuario = datosActualizados.correoElectronico;
          }
          if (datosActualizados.telefono) {
            this.telefonoOriginal = datosActualizados.telefono;
            this.telefonoUsuario = datosActualizados.telefono;
          }
          
          // Reiniciar password
          this.passwordEditado = '';

          this.modoEdicion = false;
          this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', {
            duration: 3000
          });
          this.cd.markForCheck();
        }
      });
  }

  private decodeJwt(token: string): any {
    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }

      const payloadEncoded = parts[1];
      let base64 = payloadEncoded.replace(/-/g, '+').replace(/_/g, '/');
      
      const paddingLength = (4 - base64.length % 4) % 4;
      const padded = base64 + '='.repeat(paddingLength);
      
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error al decodificar JWT:', error);
      throw error;
    }
  }
}

