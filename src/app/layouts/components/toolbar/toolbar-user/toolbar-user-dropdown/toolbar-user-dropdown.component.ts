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
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../../../auth/service/auth.service';
import { SesionesService } from '../../../../../pages/apps/ventas/service/sesiones.service';
import {
  TicketsService,
  TicketDto
} from '../../../../../pages/apps/ventas/service/tickets.service';
import { TicketReciboService } from '../../../../../pages/apps/ventas/service/ticket-recibo.service';
import { ReciboDetalleService } from '../../../../../pages/apps/ventas/service/recibo-detalle.service';
import { BitacoraUsuarioService } from '../../../../../pages/apps/usuario/gestion-usuarios/service/bitacora-usuario.service';
import { CopiasSeguridadService } from '../../../../../pages/apps/copias-seguridad/service/copias-seguridad.service';
import { TipoEgresoGestionDialogComponent } from '../../../../../pages/apps/dominios/tipo-egreso/tipo-egreso-gestion-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../../core/components/confirm-dialog/confirm-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';

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
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatRippleModule,
    RouterLink,
    NgClass,
    MatDialogModule,
    MatSnackBarModule
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
    private copiasSeguridadService: CopiasSeguridadService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
        id: '0',
        icon: 'mat:store',
        label: 'Datos del negocio',
        description: 'Configuración del establecimiento',
        colorClass: 'text-indigo-600',
        route: '/apps/tickets/configuracion-establecimiento'
      },
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
        icon: 'mat:security',
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

      this.items.push({
        id: '5',
        icon: 'mat:people',
        label: 'Gestión de clientes',
        description: 'Administrar clientes del sistema',
        colorClass: 'text-orange-600',
        route: '/apps/clientes/list'
      });

      this.items.push({
        id: '7',
        icon: 'mat:bug_report',
        label: 'Logs y errores',
        description: 'Consultar logs del servidor y del frontend',
        colorClass: 'text-amber-700',
        route: '/apps/logs-errores'
      });

      this.items.push({
        id: '8',
        icon: 'mat:account_balance_wallet',
        label: 'Notificaciones QR / email',
        description: 'Plantilla y correos de pagos electrónicos',
        colorClass: 'text-cyan-700',
        route: '/apps/gestion-notificaciones-medios-electronicos'
      });

      this.items.push({
        id: '6',
        icon: 'mat:backup',
        label: 'Copias de seguridad',
        description: 'Gestionar respaldos de la base de datos',
        colorClass: 'text-purple-600',
        submenu: [
          {
            id: '6-1',
            icon: 'mat:download',
            label: 'Generar y descargar backup',
            description: 'Crear y descargar respaldo',
            colorClass: 'text-purple-600',
            action: () => this.generarBackup()
          },
          {
            id: '6-2',
            icon: 'mat:email',
            label: 'Enviar al correo',
            description: 'Enviar copia de seguridad por correo',
            colorClass: 'text-purple-600',
            action: () => this.exportarACorreo()
          }
        ]
      });

      this.items.push({
        id: '10',
        icon: 'mat:folder',
        label: 'Dominios',
        description: 'Catálogos y tablas maestras',
        colorClass: 'text-slate-700',
        submenu: [
          {
            id: '10-1',
            icon: 'mat:receipt',
            label: 'Tipos de egreso',
            description: 'CRUD tipo_egreso',
            colorClass: 'text-slate-700',
            action: () => this.openTipoEgresoGestion()
          }
        ]
      });

      if (environment.sandbox === true) {
        this.items.push({
          id: '9',
          icon: 'mat:warning',
          label: 'Reset datos transaccionales',
          description: 'Solo sandbox: vacía ventas/cortes/ledger; conserva catálogos',
          colorClass: 'text-red-600',
          action: () => this.resetDatosTransaccionalesSandbox()
        });
      }
    }
  }

  openTipoEgresoGestion(): void {
    this.close();
    this.dialog.open(TipoEgresoGestionDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      autoFocus: false
    });
  }

  generarBackup(): void {
    this.close();
    this.copiasSeguridadService.generarBackup().subscribe({
      next: (blob: Blob) => {
        // Crear un enlace temporal para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generar nombre de archivo con fecha y hora
        const fecha = new Date();
        const fechaStr = fecha.toISOString().split('T')[0];
        const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-');
        link.download = `backup-${fechaStr}_${horaStr}.xlsx`;

        // Disparar la descarga
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.snackBar.open(
          'Copia de seguridad descargada correctamente',
          'Cerrar',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      },
      error: (error) => {
        console.error('Error al generar copia de seguridad:', error);
        this.snackBar.open('Error al generar la copia de seguridad', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  exportarACorreo(): void {
    this.close();
    this.copiasSeguridadService.exportarACorreo().subscribe({
      next: () => {
        this.snackBar.open(
          'Copia de seguridad enviada al correo correctamente',
          'Cerrar',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      },
      error: (error) => {
        console.error('Error al enviar copia de seguridad al correo:', error);
        this.snackBar.open(
          'Error al enviar la copia de seguridad al correo',
          'Cerrar',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  /** Solo sandbox: vacía transacciones; conserva catálogos / paramétricas. */
  resetDatosTransaccionalesSandbox(): void {
    this.close();
    if (environment.sandbox !== true) {
      this.snackBar.open(
        'Esta acción solo está disponible en Sandbox Mode',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }
    const dialogData: ConfirmDialogData = {
      titulo: 'Reset datos transaccionales',
      mensaje:
        'Se vaciarán <b>ventas, cortes, movimientos OF, egresos, CxC y notificaciones</b>. ' +
        'Se conservan catálogos (orígenes, medios de pago, productos, plantillas, etc.).<br/><br/>' +
        'Después debe <b>cerrar sesión y volver a entrar como ADMIN</b> para registrar la base inicial.<br/><br/>' +
        '¿Continuar? Esta acción no se puede deshacer.'
    };
    this.dialog
      .open(ConfirmDialogComponent, {
        data: dialogData,
        width: '480px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (!ok) {
          return;
        }
        this.copiasSeguridadService.resetDatosTransaccionales().subscribe({
          next: (res) => {
            this.snackBar.open(
              res?.mensaje ||
                'Reset OK. Cierre sesión y vuelva a entrar como ADMIN.',
              'Cerrar',
              { duration: 8000, panelClass: ['error-snackbar'] }
            );
          },
          error: (err) => {
            const msg =
              err?.error?.error ||
              err?.error?.message ||
              'No se pudo resetear los datos transaccionales';
            this.snackBar.open(msg, 'Cerrar', {
              duration: 7000,
              panelClass: ['error-snackbar']
            });
          }
        });
      });
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
            mensaje:
              'Existen recibos en proceso, si cierra la sesión se perderán los que no han sido asignados a un cliente identificado, ¿está seguro de querer continuar?',
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

  /** True si el ticket tiene un cliente identificado (no anónimo). */
  private tieneClienteIdentificado(ticket: TicketDto): boolean {
    const nombre = ticket.cliente?.nombre;
    return !!(nombre && nombre !== 'ANONIMO');
  }

  private verificarRecibosEnProceso(sessionId: number) {
    // Obtener todos los tickets de la sesión
    return this.ticketsService.getTicketsBySession(sessionId).pipe(
      switchMap((tickets) => {
        if (!tickets || tickets.length === 0) {
          return of(false);
        }

        // Omitir tickets con clientes identificados; solo verificar anónimos
        const ticketsAVerificar = tickets.filter(
          (t) => !this.tieneClienteIdentificado(t)
        );
        if (ticketsAVerificar.length === 0) {
          return of(false);
        }

        // Para cada ticket (solo anónimos), verificar si tiene recibo con detalles
        const verificaciones = ticketsAVerificar.map((ticket) =>
          this.ticketReciboService.getByTicketId(ticket.id, sessionId).pipe(
            switchMap((ticketRecibo) => {
              if (!ticketRecibo || !ticketRecibo.reciboId) {
                return of(false);
              }

              // Verificar si el recibo tiene detalles
              return this.reciboDetalleService
                .getDetallesByRecibo(ticketRecibo.reciboId)
                .pipe(map((detalles) => detalles && detalles.length > 0));
            })
          )
        );

        // Si hay al menos un ticket con detalles, retornar true
        return forkJoin(verificaciones).pipe(
          map((resultados) =>
            resultados.some((tieneDetalles) => tieneDetalles === true)
          )
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
    this.bitacoraUsuarioService
      .registrarEventoFinSesion()
      .pipe(
        catchError((error) => {
          // Si falla el registro de bitácora, continuar de todas formas (no bloquear el logout)
          console.warn(
            'No se pudo registrar el evento de fin de sesión en bitácora:',
            error
          );
          return of(null);
        })
      )
      .subscribe({
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
