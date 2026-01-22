import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { MenuItem } from '../interfaces/menu-item.interface';
import { trackById } from '@vex/utils/track-by';
import { VexPopoverRef } from '@vex/components/vex-popover/vex-popover-ref';
import { Router, RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../../../pages/pages/auth/service/auth.service';
import { SesionesService } from '../../../../../pages/apps/ventas/service/sesiones.service';
import { TicketsService } from '../../../../../pages/apps/ventas/service/tickets.service';
import { TicketReciboService } from '../../../../../pages/apps/ventas/service/ticket-recibo.service';
import { ReciboDetalleService } from '../../../../../pages/apps/ventas/service/recibo-detalle.service';
import { BitacoraUsuarioService } from '../../../../../pages/apps/usuario/gestion-usuarios/service/bitacora-usuario.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../core/components/confirm-dialog/confirm-dialog.component';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export interface OnlineStatus {
  id: 'online' | 'away' | 'dnd' | 'offline';
  label: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'vex-toolbar-user-dropdown',
  templateUrl: './toolbar-user-dropdown.component.html',
  styleUrls: ['./toolbar-user-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    NgFor,
    MatRippleModule,
    RouterLink,
    NgClass,
    NgIf,
    MatDialogModule
  ]
})
export class ToolbarUserDropdownComponent implements OnInit {
  items: MenuItem[] = [];

  trackById = trackById;
  rolNombre: string = 'Administrador';

  constructor(
    private cd: ChangeDetectorRef,
    private popoverRef: VexPopoverRef<ToolbarUserDropdownComponent>,
    private router: Router,
    private authService: AuthService,
    private sesionesService: SesionesService,
    private ticketsService: TicketsService,
    private ticketReciboService: TicketReciboService,
    private reciboDetalleService: ReciboDetalleService,
    private bitacoraUsuarioService: BitacoraUsuarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Obtener el nombre del rol desde localStorage
    const rolNombre = this.authService.getRolNombre();
    if (rolNombre) {
      this.rolNombre = rolNombre;
    }
    
    // Construir items del menú basado en los roles del usuario
    this.buildMenuItems();
    this.cd.markForCheck();
  }

  private buildMenuItems(): void {
    this.items = [
      {
        id: '1',
        icon: 'mat:account_circle',
        label: 'Perfil de Usuario',
        description: 'Tu información Personal',
        colorClass: 'text-teal-600',
        route: '/apps/user-profile'
      }
    ];

    // Agregar item de actividad de usuarios solo si el usuario es administrador
    if (this.authService.isAdmin()) {
      this.items.push({
        id: '2',
        icon: 'mat:people',
        label: 'Actividad de Usuarios',
        description: 'Monitoreo y gestión de usuarios',
        colorClass: 'text-blue-600',
        route: '/apps/gestion-usuarios'
      });
      
      this.items.push({
        id: '3',
        icon: 'mat:upload_file',
        label: 'Carga de productos',
        description: 'Cargar productos desde archivo Excel',
        colorClass: 'text-green-600',
        route: '/apps/cargue-productos'
      });
    }
  }


  close() {
    this.popoverRef.close();
  }

  logout() {
    // Obtener session-id del localStorage
    const sessionIdStr = localStorage.getItem('session-id');
    if (!sessionIdStr) {
      // Si no hay session-id, hacer logout directo
      this.ejecutarLogout();
      return;
    }

    const sessionId = parseInt(sessionIdStr, 10);
    if (isNaN(sessionId)) {
      // Si el session-id no es válido, hacer logout directo
      this.ejecutarLogout();
      return;
    }

    // Verificar si hay tickets con detalles
    this.verificarRecibosEnProceso(sessionId).subscribe({
      next: (tieneRecibosEnProceso) => {
        if (tieneRecibosEnProceso) {
          // Mostrar modal de advertencia
          const dialogData: ConfirmDialogData = {
            mensaje: 'Existen recibos en proceso, si cierra la sesión esto se perderán, ¿está seguro de querer continuar?',
            titulo: 'Advertencia'
          };

          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: dialogData,
            width: '400px',
            disableClose: true
          });

          dialogRef.afterClosed().subscribe((confirmado: boolean) => {
            if (confirmado) {
              // Si confirma, eliminar sesión y hacer logout
              this.eliminarSesionYLogout(sessionId);
            }
          });
        } else {
          // No hay recibos en proceso, hacer logout directo
          this.eliminarSesionYLogout(sessionId);
        }
      },
      error: (error) => {
        console.error('Error al verificar recibos en proceso:', error);
        // En caso de error, hacer logout directo
        this.eliminarSesionYLogout(sessionId);
      }
    });
  }

  private verificarRecibosEnProceso(sessionId: number) {
    // Obtener todos los tickets de la sesión
    return this.ticketsService.getTicketsBySession(sessionId).pipe(
      switchMap(tickets => {
        if (!tickets || tickets.length === 0) {
          return of(false);
        }

        // Para cada ticket, verificar si tiene recibo con detalles
        const verificaciones = tickets.map(ticket =>
          this.ticketReciboService.getByTicketId(ticket.id, sessionId).pipe(
            switchMap(ticketRecibo => {
              if (!ticketRecibo || !ticketRecibo.reciboId) {
                return of(false);
              }

              // Verificar si el recibo tiene detalles
              return this.reciboDetalleService.getDetallesByRecibo(ticketRecibo.reciboId).pipe(
                map(detalles => detalles && detalles.length > 0)
              );
            })
          )
        );

        // Si hay al menos un ticket con detalles, retornar true
        return forkJoin(verificaciones).pipe(
          map(resultados => resultados.some(tieneDetalles => tieneDetalles === true))
        );
      })
    );
  }

  private eliminarSesionYLogout(sessionId: number) {
    // Eliminar la sesión del backend
    this.sesionesService.deleteSesion(sessionId).subscribe({
      next: () => {
        // Después de eliminar la sesión, hacer logout
        this.ejecutarLogout();
      },
      error: (error) => {
        console.error('Error al eliminar sesión:', error);
        // Aunque falle, hacer logout de todas formas
        this.ejecutarLogout();
      }
    });
  }

  private ejecutarLogout() {
    // Registrar evento de fin de sesión en bitácora antes de limpiar el localStorage
    // (necesitamos el token para que el interceptor lo agregue)
    this.bitacoraUsuarioService.registrarEventoFinSesion().pipe(
      catchError((error) => {
        // Si falla el registro de bitácora, continuar de todas formas (no bloquear el logout)
        console.warn('No se pudo registrar el evento de fin de sesión en bitácora:', error);
        return of(null);
      })
    ).subscribe({
      next: () => {
        // Después de registrar la bitácora (o si falla), proceder con el logout
        this.completarLogout();
      },
      error: () => {
        // En caso de error, proceder con el logout de todas formas
        this.completarLogout();
      }
    });
  }

  private completarLogout() {
    // Limpiar todo el localStorage
    localStorage.clear();
    
    // También usar el método del servicio por si acaso
    this.authService.logout();
    
    // Cerrar el popover
    this.close();
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }
}
