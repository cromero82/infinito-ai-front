import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../core/components/confirm-dialog/confirm-dialog.component';
import {
  GestionNotificacionesMediosService,
  NotificacionEmailPagoDto,
  PlantillaNotificacionPagoDto,
  TicketSinNotificacionDto
} from '../service/gestion-notificaciones-medios.service';
import { ConfigurationService } from '../../../../auth/service/configuration.service';
import { NotificacionEmailDetalleDialogComponent } from './notificacion-email-detalle-dialog.component';
import { TicketSinNotifProductosDialogComponent } from './ticket-sin-notif-productos-dialog.component';
import { OrigenFondosService } from '../../financiero/origenes-fondos/service/origen-fondos.service';
import { OrigenFondosArbolItemDto } from '../../financiero/origenes-fondos/util/origen-fondos-arbol.util';
import {
  MetodoPagoDto,
  MetodoPagoService
} from '../service/metodo-pago.service';

const KEY_ASUNTOS_PERMITIDOS = 'notificaciones.qr.asuntos-permitidos';
const ORIGEN_TIPO_MOVIMIENTO_BANCO = 'MOVIMIENTO BANCO POR IDENTIFICAR';

@Component({
  selector: 'app-gestion-notificaciones-medios-electronicos',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './gestion-notificaciones-medios-electronicos.component.html',
  styleUrls: ['./gestion-notificaciones-medios-electronicos.component.scss']
})
export class GestionNotificacionesMediosElectronicosComponent implements OnInit {
  plantillas: PlantillaNotificacionPagoDto[] = [];
  plantillasOriginal = new Map<number, string>();
  iconosDisponibles: string[] = ['qr-bancolombia.png', 'breve-logo.png', 'otro-metodo.png'];
  cargandoPlantillas = true;
  guardandoPlantillaId: number | null = null;

  estadoVista = 'POR_IDENTIFICAR';
  busqueda = '';
  items: NotificacionEmailPagoDto[] = [];
  cargandoLista = false;
  displayedColumns = [
    'plantilla',
    'recibidoEn',
    'asunto',
    'cuerpoTexto',
    'monto',
    'nombrePagador',
    'clasificacion',
    'estadoVista',
    'acciones'
  ];
  asuntosPermitidos: string[] = [];

  ticketsSinNotifAll: TicketSinNotificacionDto[] = [];
  ticketsSinNotif: TicketSinNotificacionDto[] = [];
  cargandoTicketsSinNotif = false;
  displayedColumnsSinNotif = ['numeroVenta', 'valor', 'fecha', 'persona', 'acciones'];
  filtroFecha: Date | null = null;
  filtroPersona = '';
  filtroValor = '';
  selectedTicketSinNotifId: number | null = null;
  origenesArbol: OrigenFondosArbolItemDto[] = [];
  private metodosPagoPorId = new Map<number, MetodoPagoDto>();
  readonly naturalezasPlantilla = [
    { value: 'INGRESO', label: 'Ingreso' },
    { value: 'EGRESO', label: 'Egreso' }
  ];

  constructor(
    private api: GestionNotificacionesMediosService,
    private origenFondosService: OrigenFondosService,
    private metodoPagoService: MetodoPagoService,
    private configurationService: ConfigurationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarPlantillas();
    this.cargarLista();
    this.cargarAsuntosPermitidos();
    this.cargarTicketsSinNotificacion();
    this.cargarOrigenesFondos();
  }

  private cargarOrigenesFondos(): void {
    this.origenFondosService.findArbol().subscribe({
      next: (list) => {
        this.origenesArbol = list || [];
      },
      error: () => {
        this.origenesArbol = [];
      }
    });
    this.metodoPagoService.obtenerMetodosPago().subscribe({
      next: (list) => {
        this.metodosPagoPorId = new Map((list || []).map((m) => [m.id, m]));
      },
      error: () => {
        this.metodosPagoPorId = new Map();
      }
    });
  }

  iconoOrigenFondosUrl(cuenta: OrigenFondosArbolItemDto): string | null {
    const mpId = cuenta.metodoPagoId;
    if (mpId == null) {
      return null;
    }
    const file = this.metodosPagoPorId.get(mpId)?.file?.trim();
    if (!file) {
      return null;
    }
    return `assets/img/icons/payments/${file}`;
  }

  inicialesOrigen(nombre: string | null | undefined): string {
    const parts = (nombre ?? '')
      .replace(/[:\-_/]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (nombre ?? '?').slice(0, 2).toUpperCase();
  }

  colorOrigen(cuenta: OrigenFondosArbolItemDto): string {
    return cuenta.color?.trim() || '#5c6bc0';
  }

  cargarAsuntosPermitidos(): void {
    this.configurationService.obtenerTodasConfiguraciones().subscribe({
      next: (configs) => {
        const item = configs.find((c) => c.key === KEY_ASUNTOS_PERMITIDOS);
        this.asuntosPermitidos = item?.value ? this.parseAsuntosPermitidos(item.value) : [];
      },
      error: () => {
        this.asuntosPermitidos = [];
      }
    });
  }

  cargarPlantillas(): void {
    this.cargandoPlantillas = true;
    this.api.listarPlantillas().subscribe({
      next: (list) => {
        this.plantillas = list || [];
        this.plantillasOriginal.clear();
        this.plantillas.forEach((p) => this.plantillasOriginal.set(p.id, this.snapshotPlantilla(p)));
        this.cargandoPlantillas = false;
      },
      error: () => {
        this.cargandoPlantillas = false;
        this.snackBar.open('No se pudieron cargar las plantillas (¿puente-tienda :8095?)', 'Cerrar', {
          duration: 5000
        });
      }
    });
    this.api.iconosDisponibles().subscribe({
      next: (icons) => {
        if (icons?.length) {
          this.iconosDisponibles = icons;
        }
      }
    });
  }

  iconoUrl(filename?: string | null): string {
    return this.api.iconoUrl(filename);
  }

  plantillaDirty(p: PlantillaNotificacionPagoDto): boolean {
    if (!p.id) {
      return true;
    }
    return this.plantillasOriginal.get(p.id) !== this.snapshotPlantilla(p);
  }

  guardarPlantilla(p: PlantillaNotificacionPagoDto): void {
    if (!p.nombre?.trim() || !p.cuerpo?.trim()) {
      this.snackBar.open('Nombre y cuerpo son obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }
    this.guardandoPlantillaId = p.id ?? 0;
    const body = {
      nombre: p.nombre.trim(),
      cuerpo: p.cuerpo.trim(),
      icono: p.icono,
      activo: p.activo !== false,
      orden: p.orden,
      naturaleza: p.naturaleza || null,
      origenFondosOrigenId: p.origenFondosOrigenId ?? null,
      origenFondosDestinoId: p.origenFondosDestinoId ?? null,
      origenTipo: ORIGEN_TIPO_MOVIMIENTO_BANCO
    };
    const req$ = p.id
      ? this.api.guardarPlantilla(p.id, body)
      : this.api.crearPlantilla(body);
    req$.subscribe({
      next: () => {
        this.guardandoPlantillaId = null;
        this.snackBar.open('Plantilla guardada', 'Cerrar', { duration: 2500 });
        this.cargarPlantillas();
      },
      error: (err) => {
        this.guardandoPlantillaId = null;
        this.snackBar.open(this.mensajeError(err, 'No se pudo guardar la plantilla'), 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  tienePlantillaNueva(): boolean {
    return this.plantillas.some((p) => !p.id);
  }

  agregarPlantilla(): void {
    if (this.tienePlantillaNueva()) {
      return;
    }
    this.plantillas = [
      ...this.plantillas,
      {
        id: 0,
        nombre: '',
        cuerpo: 'recibiste una transferencia de {{nombrePagador}} por {{monto}} en tu cuenta *{{referenciaCuenta}}',
        icono: 'otro-metodo.png',
        activo: true,
        orden: this.plantillas.length + 1,
        naturaleza: 'INGRESO',
        origenFondosOrigenId: null,
        origenFondosDestinoId: null,
        origenTipo: ORIGEN_TIPO_MOVIMIENTO_BANCO
      }
    ];
  }

  eliminarPlantilla(p: PlantillaNotificacionPagoDto): void {
    if (!p.id) {
      this.plantillas = this.plantillas.filter((x) => x !== p);
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar plantilla',
        mensaje: `¿Eliminar la plantilla <b>${p.nombre}</b>?`
      } as ConfirmDialogData
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.api.eliminarPlantilla(p.id).subscribe({
        next: () => {
          this.snackBar.open('Plantilla eliminada', 'Cerrar', { duration: 2500 });
          this.cargarPlantillas();
        },
        error: (err) =>
          this.snackBar.open(this.mensajeError(err, 'No se pudo eliminar la plantilla'), 'Cerrar', {
            duration: 4000
          })
      });
    });
  }

  private snapshotPlantilla(p: PlantillaNotificacionPagoDto): string {
    return JSON.stringify({
      nombre: p.nombre,
      cuerpo: p.cuerpo,
      icono: p.icono,
      activo: p.activo !== false,
      orden: p.orden,
      naturaleza: p.naturaleza || null,
      origenFondosOrigenId: p.origenFondosOrigenId ?? null,
      origenFondosDestinoId: p.origenFondosDestinoId ?? null,
      origenTipo: p.origenTipo || ORIGEN_TIPO_MOVIMIENTO_BANCO
    });
  }

  cargarLista(): void {
    this.cargandoLista = true;
    const estado = this.estadoVista === 'TODAS' ? undefined : this.estadoVista;
    this.api.listar(estado, this.busqueda.trim() || undefined).subscribe({
      next: (list) => {
        this.items = list || [];
        this.cargandoLista = false;
      },
      error: () => {
        this.cargandoLista = false;
        this.snackBar.open('No se pudieron cargar las notificaciones (¿puente-tienda :8095?)', 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  asuntoNoPermitido(row: NotificacionEmailPagoDto): boolean {
    if (!this.asuntosPermitidos.length) {
      return false;
    }
    const asunto = this.normalizarAsunto(row.asunto);
    if (!asunto) {
      return true;
    }
    return !this.asuntosPermitidos.some((permitido) => {
      const p = this.normalizarAsunto(permitido);
      return !!p && (asunto === p || asunto.includes(p));
    });
  }

  tooltipAsunto(row: NotificacionEmailPagoDto): string {
    const asunto = row.asunto || '—';
    if (!this.asuntoNoPermitido(row)) {
      return asunto;
    }
    const lista = this.asuntosPermitidos.join(', ');
    return `Asunto no permitido (no debía filtrarse). Permitidos: ${lista}. Actual: ${asunto}`;
  }

  previewCuerpo(raw?: string | null, max = 120): string {
    if (!raw) {
      return '—';
    }
    const plain = raw.replace(/\s+/g, ' ').trim();
    if (plain.length <= max) {
      return plain;
    }
    return `${plain.slice(0, max)}…`;
  }

  private parseAsuntosPermitidos(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as { permitidas?: unknown };
      if (!Array.isArray(parsed?.permitidas)) {
        return [];
      }
      return parsed.permitidas.map((s) => String(s).trim()).filter((s) => !!s);
    } catch {
      return [];
    }
  }

  private normalizarAsunto(raw?: string | null): string {
    return (raw || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private mensajeError(err: any, fallback: string): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body?.error) {
      return String(body.error);
    }
    if (body?.detalle) {
      return String(body.detalle);
    }
    if (err?.status === 0) {
      return `${fallback} (sin respuesta del servidor / CORS)`;
    }
    return fallback;
  }

  cargarTicketsSinNotificacion(): void {
    this.cargandoTicketsSinNotif = true;
    this.api.listarTicketsSinNotificacion().subscribe({
      next: (list) => {
        this.ticketsSinNotifAll = list || [];
        this.aplicarFiltroTickets();
        this.cargandoTicketsSinNotif = false;
      },
      error: () => {
        this.cargandoTicketsSinNotif = false;
        this.snackBar.open('No se pudieron cargar tickets sin notificación', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  aplicarFiltroTickets(): void {
    const persona = this.filtroPersona.trim().toLowerCase();
    const valorBuscado = this.parseValorFiltro(this.filtroValor);
    const dia = this.filtroFecha ? this.ymdLocal(this.filtroFecha) : null;

    this.ticketsSinNotif = this.ticketsSinNotifAll.filter((row) => {
      if (dia && this.ymdLocal(new Date(row.fecha)) !== dia) {
        return false;
      }
      if (persona && !(row.persona || '').toLowerCase().includes(persona)) {
        return false;
      }
      if (valorBuscado != null && Math.round(Number(row.valor)) !== valorBuscado) {
        return false;
      }
      return true;
    });
  }

  private parseValorFiltro(raw: string): number | null {
    const digits = (raw || '').replace(/[^\d]/g, '');
    if (!digits) {
      return null;
    }
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

  private ymdLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  seleccionarTicketSinNotif(row: TicketSinNotificacionDto): void {
    this.selectedTicketSinNotifId = row.id;
  }

  esTicketSinNotifSeleccionado(row: TicketSinNotificacionDto): boolean {
    return this.selectedTicketSinNotifId === row.id;
  }

  verProductosTicket(row: TicketSinNotificacionDto): void {
    this.seleccionarTicketSinNotif(row);
    this.dialog.open(TicketSinNotifProductosDialogComponent, {
      width: '560px',
      data: {
        historialReciboId: row.historialReciboId,
        numeroVenta: row.numeroVenta,
        total: row.valor
      }
    });
  }

  ver(row: NotificacionEmailPagoDto): void {
    const ref = this.dialog.open(NotificacionEmailDetalleDialogComponent, {
      width: '680px',
      data: {
        ...row,
        origenesArbol: this.origenesArbol,
        plantillas: this.plantillas
      }
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.snackBar.open('Notificación legalizada', 'Cerrar', { duration: 2500 });
        this.cargarLista();
        this.cargarOrigenesFondos();
      }
    });
  }

  archivar(row: NotificacionEmailPagoDto): void {
    this.api.archivar(row.id).subscribe({
      next: () => {
        this.snackBar.open('Notificación archivada', 'Cerrar', { duration: 2500 });
        this.cargarLista();
      },
        error: (err) =>
          this.snackBar.open(this.mensajeError(err, 'No se pudo archivar'), 'Cerrar', {
            duration: 4000
          })
    });
  }

  eliminar(row: NotificacionEmailPagoDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar notificación',
        mensaje: `¿Eliminar la notificación #${row.id}? Esta acción no se puede deshacer.`
      } as ConfirmDialogData
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.api.eliminar(row.id).subscribe({
        next: () => {
          this.snackBar.open('Notificación eliminada', 'Cerrar', { duration: 2500 });
          this.cargarLista();
        },
        error: (err) =>
          this.snackBar.open(this.mensajeError(err, 'No se pudo eliminar'), 'Cerrar', {
            duration: 4000
          })
      });
    });
  }
}
