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
  idReferencia: number;
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
  nombreUsuario = '—';

  egreso: EgresoDto | null = null;
  corte: CorteVentaSearchItemDto | null = null;
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
      this.titulo =
        tipo === 'EGRESO_REVERSION'
          ? `Reversión egreso #${this.data.idReferencia}`
          : `Egreso #${this.data.idReferencia}`;
      this.cargarEgreso();
      return;
    }
    if (
      tipo === 'CORTE_VENTA' ||
      tipo === 'CORTE_VENTA_REVERSO' ||
      tipo === 'CIERRE' ||
      tipo === 'CIERRE_REVERSO'
    ) {
      this.vista = 'corte';
      this.titulo = `Corte de venta #${this.data.idReferencia}`;
      this.cargarCorte();
      return;
    }
    this.vista = 'desconocido';
    this.titulo = 'Referencia';
    this.loading = false;
    this.error = `No hay vista de solo lectura para origen «${this.data.origenTipo}».`;
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

  private cargarEgreso(): void {
    this.egresosService
      .getEgresoById(this.data.idReferencia)
      .pipe(
        catchError(() => {
          this.error = `No se pudo cargar el egreso #${this.data.idReferencia}.`;
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

  private cargarCorte(): void {
    this.metodoPagoService.obtenerMetodosPagoParaTickets().subscribe({
      next: (mps) => {
        this.metodosPorId = new Map((mps ?? []).map((m) => [m.id, m]));
      }
    });
    this.corteVentaService
      .obtenerPorId(this.data.idReferencia)
      .pipe(
        catchError(() => {
          this.error = `No se pudo cargar el corte #${this.data.idReferencia}.`;
          this.loading = false;
          return of(null);
        })
      )
      .subscribe((corte) => {
        this.corte = corte;
        if (!this.data.usuarioId && corte?.usuarioId) {
          this.nombreUsuario = this.resolverNombreUsuario(corte.usuarioId);
        }
        this.loading = false;
      });
  }

  get detallesCorte(): CorteVentaDetalleDto[] {
    return this.corte?.detalles ?? [];
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
