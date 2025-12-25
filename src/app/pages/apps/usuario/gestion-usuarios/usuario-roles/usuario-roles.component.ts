import { Component, OnInit, OnDestroy } from '@angular/core';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../pages/auth/service/auth.service';

export interface Rol {
  id: number;
  nombre: string;
  sigla: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  correoElectronico: string;
  contrasena: string;
  telefono: string;
  activo: boolean;
  roles: Rol[];
}

export interface UsuarioConRolesEditados extends Usuario {
  rolesEditados: string[]; // Array de siglas de roles después de ediciones
  tieneCambios: boolean; // Indica si hay cambios pendientes
}

@Component({
  selector: 'gm-usuario-roles',
  templateUrl: './usuario-roles.component.html',
  styleUrls: ['./usuario-roles.component.scss'],
  animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms],
  standalone: true,
  imports: [
    MatIconModule, 
    NgFor, 
    NgIf, 
    MatButtonModule, 
    CommonModule,
    MatTableModule,
    MatSnackBarModule
  ]
})
export class UsuarioRolesComponent implements OnInit, OnDestroy {
  usuarios: UsuarioConRolesEditados[] = [];
  roles: Rol[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = ['nombre', 'correoElectronico', 'telefono', 'roles', 'acciones'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      usuarios: this.authService.obtenerUsuarios(),
      roles: this.authService.obtenerRoles()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ usuarios, roles }: { usuarios: any[], roles: Rol[] }) => {
        this.roles = roles;
        this.usuarios = usuarios.map((usuario: Usuario) => ({
          ...usuario,
          rolesEditados: usuario.roles.map((r: Rol) => r.sigla), // Inicializar con roles actuales
          tieneCambios: false
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading data', err);
        this.error = 'Error al cargar los datos.';
        this.loading = false;
      }
    });
  }

  toggleRol(usuario: UsuarioConRolesEditados, rolSigla: string): void {
    const index = usuario.rolesEditados.indexOf(rolSigla);
    if (index > -1) {
      // Remover rol
      usuario.rolesEditados = usuario.rolesEditados.filter(s => s !== rolSigla);
    } else {
      // Agregar rol
      usuario.rolesEditados.push(rolSigla);
    }
    
    // Verificar si hay cambios comparando con los roles originales
    const rolesOriginales = usuario.roles.map(r => r.sigla).sort().join(',');
    const rolesEditadosSorted = [...usuario.rolesEditados].sort().join(',');
    usuario.tieneCambios = rolesOriginales !== rolesEditadosSorted;
  }

  tieneRol(usuario: UsuarioConRolesEditados, rolSigla: string): boolean {
    return usuario.rolesEditados.includes(rolSigla);
  }

  tieneCambios(usuario: UsuarioConRolesEditados): boolean {
    return usuario.tieneCambios;
  }

  aplicarCambios(usuario: UsuarioConRolesEditados): void {
    if (!usuario.tieneCambios) {
      return;
    }

    this.loading = true;
    this.authService.actualizarRolesUsuario(usuario.correoElectronico, usuario.rolesEditados)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Actualizar los roles originales con los editados
          usuario.roles = this.roles.filter(r => usuario.rolesEditados.includes(r.sigla));
          usuario.tieneCambios = false;
          this.loading = false;
          this.snackBar.open('Roles actualizados correctamente', 'Cerrar', {
            duration: 3000
          });
        },
        error: (err) => {
          console.error('Error updating roles', err);
          this.loading = false;
          this.snackBar.open('Error al actualizar los roles', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }
}



