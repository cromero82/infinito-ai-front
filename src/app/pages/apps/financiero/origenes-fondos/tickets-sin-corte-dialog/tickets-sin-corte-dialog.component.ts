import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  HistorialReciboDto,
  HistorialReciboPage,
  HistorialReciboService
} from '../../../ventas/service/historial-recibo.service';
import {
  EstadoReciboDto,
  EstadoRecibosService
} from '../../../ventas/service/estado-recibos.service';
import {
  ClienteDto,
  ClienteService
} from '../../../ventas/service/cliente.service';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';
import { SesionesService } from '../../../ventas/service/sesiones.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TicketProductosDialogComponent,
  TicketProductosDialogData
} from '../../../ventas/ticket-productos-dialog/ticket-productos-dialog.component';
import {
  esNotificacionConfirmada,
  labelNotificacionElectronica
} from '../../../ventas/util/notificacion-electronica-ticket.util';

export interface TicketsSinCorteDialogData {
  metodoPagoId: number;
  metodoPagoNombre: string;
  /** Color del dominio (p.ej. Nequi morado). */
  metodoPagoColor?: string | null;
  totalTicketsSinCorte?: number;
}

@Component({
  selector: 'vex-tickets-sin-corte-dialog',
  standalone: true,
  imports: [
    CurrencyPipe,
    DragDropModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './tickets-sin-corte-dialog.component.html',
  styleUrls: ['./tickets-sin-corte-dialog.component.scss']
})
export class TicketsSinCorteDialogComponent implements OnInit, OnDestroy {
  loading = false;
  loadingMore = false;
  error: string | null = null;
  recibos: HistorialReciboDto[] = [];
  page = 1;
  size = 20;
  totalElements = 0;
  hasMore = false;

  private estadoPagadoId: number | undefined;
  private clientes = new Map<number, string>();
  /** Cache sesionId → nombre completo del usuario que atendió. */
  private usuariosPorSesion = new Map<number, string>();
  private usuariosLoading = new Set<number>();
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TicketsSinCorteDialogData,
    private dialogRef: MatDialogRef<TicketsSinCorteDialogComponent>,
    private dialog: MatDialog,
    private historialReciboService: HistorialReciboService,
    private estadoRecibosService: EstadoRecibosService,
    private clienteService: ClienteService,
    private sesionesService: SesionesService,
    private fechaUtilService: FechaUtilService
  ) {}

  get medioNombre(): string {
    return (this.data.metodoPagoNombre || '').trim().toUpperCase() || 'MEDIO';
  }

  get medioColor(): string {
    const c = (this.data.metodoPagoColor || '').trim();
    return c || '#1565c0';
  }

  ngOnInit(): void {
    this.clienteService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list: ClienteDto[]) => {
          this.clientes = new Map(
            list.map((c) => [c.id, (c.nombre ?? '').trim() || `Cliente ${c.id}`])
          );
        }
      });

    this.estadoRecibosService
      .getEstadosRecibos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estados: EstadoReciboDto[]) => {
          this.estadoPagadoId = estados.find((e) => e.sigla === 'P')?.id;
          this.loadPage(true);
        },
        error: () => {
          this.estadoPagadoId = 2;
          this.loadPage(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.dialogRef.close();
  }

  onScroll(ev: Event): void {
    const el = ev.target as HTMLElement;
    if (!el || this.loadingMore || !this.hasMore) {
      return;
    }
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      this.page += 1;
      this.loadPage(false);
    }
  }

  clienteNombre(clienteId: number): string {
    return this.clientes.get(clienteId) ?? '';
  }

  /** Nombre de quien atendió la venta (vía sesión del ticket). */
  usuarioAtendio(
    sesionId: number | null | undefined
  ): { short: string; full: string } | null {
    if (sesionId == null || sesionId <= 0) {
      return null;
    }
    const full = this.usuariosPorSesion.get(sesionId)?.trim();
    if (!full) {
      return null;
    }
    return { short: this.abreviarNombre(full), full };
  }

  formatDate(iso: string): string {
    return this.fechaUtilService.formatDate(iso);
  }

  labelNotif(r: HistorialReciboDto): string | null {
    return labelNotificacionElectronica(r.estadoNotificacionElectronica);
  }

  notifOk(r: HistorialReciboDto): boolean {
    return esNotificacionConfirmada(r.estadoNotificacionElectronica);
  }

  verProductos(r: HistorialReciboDto, event: Event): void {
    event.stopPropagation();
    const atendido = this.usuarioAtendio(r.sesionId);
    const data: TicketProductosDialogData = {
      historialReciboId: r.id,
      titulo: r.documentoVentaConsecutivo
        ? `Productos · ${r.documentoVentaConsecutivo}`
        : `Productos · ticket #${r.id}`,
      totalTicket: r.total,
      atendidoNombre: atendido?.full ?? null,
      sesionId: r.sesionId
    };
    this.dialog.open(TicketProductosDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data
    });
  }

  private loadPage(reset: boolean): void {
    if (reset) {
      this.loading = true;
      this.page = 1;
      this.recibos = [];
      this.error = null;
    } else {
      this.loadingMore = true;
    }

    this.historialReciboService
      .searchHistorialRecibos(
        this.page,
        this.size,
        'fechaCreacion,desc',
        undefined,
        this.estadoPagadoId,
        null,
        false,
        {
          metodoPagoId: this.data.metodoPagoId,
          sinCorte: true
        }
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: HistorialReciboPage) => {
          const batch = page.content ?? [];
          this.recibos = reset ? batch : [...this.recibos, ...batch];
          this.totalElements = page.totalElements ?? this.recibos.length;
          this.hasMore = !page.last && batch.length > 0;
          this.loading = false;
          this.loadingMore = false;
          this.resolveUsuariosAtendieron(batch);
        },
        error: () => {
          this.error = 'No se pudieron cargar los tickets sin corte.';
          this.loading = false;
          this.loadingMore = false;
        }
      });
  }

  private resolveUsuariosAtendieron(batch: HistorialReciboDto[]): void {
    const ids = new Set<number>();
    for (const r of batch) {
      const sid = r.sesionId;
      if (
        sid != null &&
        sid > 0 &&
        !this.usuariosPorSesion.has(sid) &&
        !this.usuariosLoading.has(sid)
      ) {
        ids.add(sid);
      }
    }
    for (const sesionId of ids) {
      this.usuariosLoading.add(sesionId);
      this.sesionesService
        .getUsuarioBySesionId(sesionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (u) => {
            const nombre = (u?.nombre ?? '').trim();
            if (nombre) {
              this.usuariosPorSesion.set(sesionId, nombre);
            }
            this.usuariosLoading.delete(sesionId);
          },
          error: () => {
            this.usuariosLoading.delete(sesionId);
          }
        });
    }
  }

  /** "Jhon Doe" → "Jhon D." */
  private abreviarNombre(nombre: string): string {
    const palabras = nombre.trim().split(/\s+/).filter(Boolean);
    if (palabras.length <= 1) {
      return nombre.trim();
    }
    return `${palabras[0]} ${palabras[1].charAt(0).toUpperCase()}.`;
  }
}
