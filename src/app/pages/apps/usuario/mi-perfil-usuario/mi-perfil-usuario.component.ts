import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class MiPerfilUsuarioComponent implements OnInit, AfterViewInit {
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

  @ViewChild('passwordInput', { static: false }) passwordInputRef?: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    // Este método se ejecuta solo una vez al inicio, pero el campo puede no estar renderizado aún
    // El campo se renderiza cuando modoEdicion cambia a true
  }

  private checkAndFixPasswordInput(): void {
    if (!this.modoEdicion) return;
    
    // Intentar usar ViewChild primero
    let input = this.passwordInputRef?.nativeElement;
    
    // Si ViewChild no está disponible (porque el campo aún no se renderizó), usar querySelector
    if (!input) {
      input = document.querySelector(`input[id='password-field-${this.fieldId}']`) as HTMLInputElement;
    }
    
    if (input) {
      // Forzar tipo 'text' directamente en el DOM
      input.type = 'text';
      
      // Forzar autocomplete deshabilitado con múltiples valores
      input.setAttribute('autocomplete', 'chrome-off');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocomplete', 'new-password');
      
      // Eliminar atributos que puedan indicar que es un campo de contraseña
      input.removeAttribute('name');
      input.removeAttribute('id');
      
      // Reestablecer con valores dinámicos después de un momento
      setTimeout(() => {
        input!.setAttribute('name', `password-field-${this.fieldId}`);
        input!.setAttribute('id', `password-field-${this.fieldId}`);
      }, 0);
      
      // Agregar event listeners agresivos para prevenir autocomplete
      const preventAutocomplete = () => {
        input!.type = 'text';
        input!.setAttribute('autocomplete', 'off');
        input!.removeAttribute('name');
        setTimeout(() => {
          input!.setAttribute('name', `password-field-${this.fieldId}`);
        }, 0);
      };
      
      input.addEventListener('focus', preventAutocomplete, true);
      input.addEventListener('click', preventAutocomplete, true);
      input.addEventListener('mousedown', preventAutocomplete, true);
      input.addEventListener('touchstart', preventAutocomplete, true);
      
      // MutationObserver para detectar cambios en el tipo
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            const target = mutation.target as HTMLInputElement;
            if (target.type === 'password') {
              target.type = 'text';
            }
            if (target.getAttribute('autocomplete') && target.getAttribute('autocomplete') !== 'off') {
              target.setAttribute('autocomplete', 'off');
            }
          }
        });
      });
      
      observer.observe(input, {
        attributes: true,
        attributeFilter: ['type', 'autocomplete']
      });
    }
  }

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
    this.passwordInputType = 'text'; // Resetear a texto para evitar detección de password
    // Reiniciar valores editados con los originales
    this.nombreEditado = this.nombreOriginal;
    this.correoEditado = this.correoOriginal;
    this.telefonoEditado = this.telefonoOriginal;
    this.passwordEditado = '';
    this.cd.markForCheck();
    
    // Asegurar que el campo se inicialice correctamente después de renderizarse
    // Usar múltiples timeouts para asegurar que se ejecute después de que Angular renderice
    setTimeout(() => {
      this.checkAndFixPasswordInput();
      // Intentar una segunda vez después de un pequeño delay
      setTimeout(() => {
        this.checkAndFixPasswordInput();
      }, 50);
    }, 0);
  }

  preventPasswordManager(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.type = 'text';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocomplete', 'chrome-off');
      // Cambiar temporalmente el name para confundir al navegador
      const originalName = input.getAttribute('name');
      input.removeAttribute('name');
      setTimeout(() => {
        if (originalName) {
          input.setAttribute('name', originalName);
        }
      }, 0);
    }
  }

  onPasswordFocus(event: any): void {
    const input = event.target as HTMLInputElement;
    input.removeAttribute('readonly');
    // Mantener como text inicialmente para prevenir autocomplete
    input.type = 'text';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocomplete', 'chrome-off');
    // Solo cambiar a password cuando el usuario empieza a escribir
    // No cambiar en focus, solo cuando haya input
  }

  onPasswordInput(event: any): void {
    const input = event.target as HTMLInputElement;
    input.removeAttribute('readonly');
    // Cambiar a password solo cuando el usuario empieza a escribir
    if (input.type === 'text') {
      // Solo cambiar si hay contenido
      if (input.value.length > 0) {
        input.type = 'password';
        this.passwordInputType = 'password';
        this.cd.markForCheck();
      }
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

