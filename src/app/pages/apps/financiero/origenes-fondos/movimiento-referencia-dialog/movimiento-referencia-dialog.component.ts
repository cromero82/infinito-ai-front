import { Component, Inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../../../auth/service/auth.service';
import {
  EgresoDto,
  EgresosService
} from '../../egresos/service/egresos.service';
import {
  CorteVentaDetalleDto,
  CorteVentaSearchItemDto,
  CorteVentaService
} from '../../../ventas/service/corte-venta.service';
import {
  MetodoPagoDto,
  MetodoPagoService
} from '../../../ventas/service/metodo-pago.service';
import { OrigenFondosService } from '../service/origen-fondos.service';
import { OrigenFondosArbolItemDto } from '../util/origen-fondos-arbol.util';

export interface MovimientoReferenciaDialogData {
  origenTipo: string;
  /** Un solo id (flujo OF / egreso / un corte). */
  idReferencia?: number;
  /**
   * Varios cortes (p. ej. Ingresos → Detalles por fecha).
   * Si viene poblado, tiene prioridad sobre `idReferencia` para vista corte.
   */
  corteIds?: number[];
  /** usuario_id del movimiento (quien lo registró). */
  usuarioId?: string | null;
}

type VistaReferencia = 'egreso' | 'corte' | 'desconocido';

@Component({
  selector: 'vex-movimiento-referencia-dialog',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTableModule,
    MatTabsModule,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './movimiento-referencia-dialog.component.html',
  styleUrl: './movimiento-referencia-dialog.component.scss'
})
export class MovimientoReferenciaDialogComponent implements OnInit {
  loading = true;
  error: string | null = null;
  vista: VistaReferencia = 'desconocido';
  titulo = 'Detalle';
  /** Fecha del corte en badge: «Sábado, 15 Agosto». */
  fechaTitulo = '';
  nombreUsuario = '—';

  egreso: EgresoDto | null = null;
  /** Lista de cortes (1..N). El seleccionado es `corte`. */
  cortes: CorteVentaSearchItemDto[] = [];
  corteSeleccionadoIndex = 0;
  origenEgresoNombre: string | null = null;

  private metodosPorId = new Map<number, MetodoPagoDto>();

  detalleColumns = [
    'metodo',
    'base',
    'ventas',
    'egresos',
    'movimientos',
    'sistema',
    'real',
    'desfase'
  ];

  constructor(
    private dialogRef: MatDialogRef<MovimientoReferenciaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoReferenciaDialogData,
    private egresosService: EgresosService,
    private corteVentaService: CorteVentaService,
    private metodoPagoService: MetodoPagoService,
    private origenFondosService: OrigenFondosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.nombreUsuario = this.resolverNombreUsuario(this.data.usuarioId);
    const tipo = (this.data.origenTipo ?? '').toUpperCase();
    if (tipo === 'EGRESO' || tipo === 'EGRESO_REVERSION') {
      this.vista = 'egreso';
      const id = this.data.idReferencia;
      this.titulo =
        tipo === 'EGRESO_REVERSION'
          ? `Reversión egreso #${id}`
          : `Egreso #${id}`;
      if (id == null) {
        this.loading = false;
        this.error = 'Falta id de egreso.';
        return;
      }
      this.cargarEgreso(id);
      return;
    }
    if (
      tipo === 'CORTE_VENTA' ||
      tipo === 'CORTE_VENTA_REVERSO' ||
      tipo === 'CIERRE' ||
      tipo === 'CIERRE_REVERSO'
    ) {
      this.vista = 'corte';
      const ids = this.resolverCorteIds();
      this.titulo =
        ids.length > 1
          ? `Corte de venta (${ids.length})`
          : `Corte de venta #${ids[0] ?? ''}`;
      this.cargarCortes(ids);
      return;
    }
    this.vista = 'desconocido';
    this.titulo = 'Referencia';
    this.loading = false;
    this.error = `No hay vista de solo lectura para origen «${this.data.origenTipo}».`;
  }

  get corte(): CorteVentaSearchItemDto | null {
    return this.cortes[this.corteSeleccionadoIndex] ?? null;
  }

  get esMultiCorte(): boolean {
    return this.cortes.length > 1;
  }

  private resolverCorteIds(): number[] {
    if (this.data.corteIds?.length) {
      return this.data.corteIds.filter((id) => Number.isFinite(id));
    }
    if (this.data.idReferencia != null) {
      return [this.data.idReferencia];
    }
    return [];
  }

  private resolverNombreUsuario(usuarioId: string | null | undefined): string {
    const id = usuarioId?.trim();
    if (!id) {
      return '—';
    }
    const u = this.authService
      .obtenerTodosUsuariosCache()
      .find((x) => x.id === id);
    return u?.nombre?.trim() || id;
  }

  private cargarEgreso(id: number): void {
    this.egresosService
      .getEgresoById(id)
      .pipe(
        catchError(() => {
          this.error = `No se pudo cargar el egreso #${id}.`;
          this.loading = false;
          return of(null);
        })
      )
      .subscribe((egreso) => {
        if (!egreso) {
          return;
        }
        this.egreso = egreso;
        if (egreso.origenFondosId != null) {
          this.origenFondosService
            .findArbol()
            .pipe(catchError(() => of([] as OrigenFondosArbolItemDto[])))
            .subscribe((arbol) => {
              const cuenta = arbol.find((o) => o.id === egreso.origenFondosId);
              this.origenEgresoNombre =
                cuenta?.nombre ?? `Origen #${egreso.origenFondosId}`;
              this.loading = false;
            });
        } else {
          this.loading = false;
        }
      });
  }

  private cargarCortes(ids: number[]): void {
    if (!ids.length) {
      this.loading = false;
      this.error = 'No se indicaron ids de corte.';
      return;
    }
    this.metodoPagoService.obtenerMetodosPagoParaTickets().subscribe({
      next: (mps) => {
        this.metodosPorId = new Map((mps ?? []).map((m) => [m.id, m]));
      }
    });
    this.corteVentaService
      .obtenerPorIds(ids)
      .pipe(
        catchError(() => {
          this.error =
            ids.length > 1
              ? `No se pudieron cargar los cortes (${ids.join(', ')}).`
              : `No se pudo cargar el corte #${ids[0]}.`;
          this.loading = false;
          return of([] as CorteVentaSearchItemDto[]);
        })
      )
      .subscribe((lista) => {
        this.cortes = lista ?? [];
        this.corteSeleccionadoIndex = 0;
        if (!this.cortes.length) {
          this.error =
            ids.length > 1
              ? 'No se encontraron cortes para los ids indicados.'
              : `No se encontró el corte #${ids[0]}.`;
        } else {
          this.actualizarTituloCortes();
          if (!this.data.usuarioId && this.corte?.usuarioId) {
            this.nombreUsuario = this.resolverNombreUsuario(this.corte.usuarioId);
          }
        }
        this.loading = false;
      });
  }

  private actualizarTituloCortes(): void {
    const n = this.cortes.length;
    this.fechaTitulo = this.formatearFechaTitulo(this.cortes[0]?.fechaIni);
    if (n > 1) {
      this.titulo = `Corte de venta (${n})`;
    } else {
      this.titulo = `Corte de venta #${this.cortes[0].id}`;
    }
  }

  /** Ej.: «Sábado, 15 Agosto» */
  private formatearFechaTitulo(iso: string | null | undefined): string {
    if (!iso) {
      return '';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const diaSemana = this.capitalizar(
      d.toLocaleDateString('es-CO', { weekday: 'long' })
    );
    const diaMes = d.getDate();
    const mes = this.capitalizar(
      d.toLocaleDateString('es-CO', { month: 'long' })
    );
    return `${diaSemana}, ${diaMes} ${mes}`;
  }

  private capitalizar(s: string): string {
    const t = (s ?? '').trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }

  onTabChange(index: number): void {
    this.corteSeleccionadoIndex = index;
    const c = this.corte;
    if (c?.usuarioId) {
      this.nombreUsuario = this.resolverNombreUsuario(c.usuarioId);
    }
  }

  etiquetaTabCorte(c: CorteVentaSearchItemDto): string {
    if (this.mismoDiaCalendario(c.fechaIni, c.fechaFin)) {
      return `#${c.id} · ${this.formatearHoraAmPm(c.fechaIni)} - ${this.formatearHoraAmPm(c.fechaFin)}`;
    }
    return `#${c.id} · ${this.formatearPeriodoCorto(c.fechaIni)} — ${this.formatearPeriodoCorto(c.fechaFin)}`;
  }

  private mismoDiaCalendario(a: string, b: string): boolean {
    return (
      CorteVentaService.fechaCalendarioDesdeIso(a) ===
      CorteVentaService.fechaCalendarioDesdeIso(b)
    );
  }

  private formatearHoraAmPm(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const suf = h >= 12 ? 'p.m.' : 'a.m.';
    h = h % 12;
    if (h === 0) {
      h = 12;
    }
    return `${String(h).padStart(2, '0')}:${m} ${suf}`;
  }

  private formatearPeriodoCorto(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy} ${this.formatearHoraAmPm(iso)}`;
  }

  get detallesCorte(): CorteVentaDetalleDto[] {
    return this.corte?.detalles ?? [];
  }

  get sumaTotalSistemaDetalle(): number {
    return this.detallesCorte.reduce(
      (s, d) => s + (Number(d.totalSistema) || 0),
      0
    );
  }

  get sumaTotalFisicoDetalle(): number {
    const bruto = this.detallesCorte.reduce(
      (s, d) => s + (Number(d.total) || 0),
      0
    );
    const baseEfectivo = this.detallesCorte
      .filter((d) => this.esFilaEfectivo(d))
      .reduce((s, d) => s + Math.round(Number(d.base) || 0), 0);
    return Math.round(bruto) - baseEfectivo;
  }

  esFilaEfectivo(d: CorteVentaDetalleDto): boolean {
    const mp = this.metodosPorId.get(d.metodoPagoId);
    const sigla = (mp?.sigla || '').trim().toUpperCase();
    const nombre = (mp?.descripcion || '').trim().toLowerCase();
    return sigla === 'EF' || nombre === 'efectivo';
  }

  /** Contado físico menos la base de efectivo. */
  contadoMenosBase(d: CorteVentaDetalleDto): number {
    return Math.round(Number(d.total) || 0) - Math.round(Number(d.base) || 0);
  }

  get sumaDesfaseDetalle(): number {
    return this.detallesCorte.reduce((s, d) => s + (Number(d.desfase) || 0), 0);
  }

  metodoPagoNombre(metodoPagoId: number | null | undefined): string {
    if (metodoPagoId == null) {
      return '—';
    }
    return (
      this.metodosPorId.get(metodoPagoId)?.descripcion ?? `MP #${metodoPagoId}`
    );
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
