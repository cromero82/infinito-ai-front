import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, merge } from 'rxjs';
import { takeUntil, finalize, debounceTime, filter } from 'rxjs/operators';
import { MetodoPagoService, MetodoPagoDto } from '../../../ventas/service/metodo-pago.service';
import { CorteVentaService, ConsultarRangoCorteDto } from '../../../ventas/service/corte-venta.service';
import {
  MotivoMovimientoDto,
  MotivoMovimientoService
} from '../../origenes-fondos/service/motivo-movimiento.service';
import { OrigenFondosService } from '../../origenes-fondos/service/origen-fondos.service';
import {
  OrigenMovimientoDialogComponent
} from '../../origenes-fondos/origen-movimiento-dialog/origen-movimiento-dialog.component';
import { OrigenFondosArbolItemDto } from '../../origenes-fondos/util/origen-fondos-arbol.util';
import { AuthService } from '../../../../../auth/service/auth.service';
import {
  AsistenteCierreCajaDialogComponent,
  AsistenteCierreCajaResultado,
  ConteoBilletes
} from './asistente-cierre-caja-dialog.component';
import {
  claseDesfaseCierre,
  textoDesfaseCierre,
  tieneDesfaseCierre
} from './cierre-desfase.util';

export interface CierreVentasData {}

export interface CierreVentasResultado {
  success: boolean;
  registrosCreados: number;
  corteVentaId?: number;
  /** Si true, el caller debe abrir Distribución de efectivo (admin). */
  abrirDistribucion?: boolean;
  /** Si true, el caller debe cerrar sesión (cajero sin permiso de distribución). */
  requiereLogout?: boolean;
}

interface CorteVentaRow {
  metodoPago: MetodoPagoDto;
  base: number;
  totalVentasSistema: number;
  totalEgresosSistema: number;
  totalMovimientosSistema: number;
  totalSistema: number;
  totalRealCtrl: FormControl<number | null>;
  desfase: number;
  motivoDesfaseCtrl: FormControl<number | null>;
}

@Component({
    selector: 'vex-cierre-ventas',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatSelectModule,
        MatTooltipModule,
        DragDropModule,
        ReactiveFormsModule
    ],
    templateUrl: './cierre-ventas.component.html',
    styleUrls: ['./cierre-ventas.component.scss']
})
export class CierreVentasComponent implements OnInit, OnDestroy {
  fechaInicioCtrl = new FormControl<Date | null>(new Date(), [Validators.required]);
  horaInicioCtrl = new FormControl<string>('08:00', [Validators.required]);
  fechaFinCtrl = new FormControl<Date | null>(new Date(), [Validators.required]);
  horaFinCtrl = new FormControl<string>('18:00', [Validators.required]);

  desdeUltimoCorteCtrl = new FormControl<boolean>(true);
  hastaActualmenteCtrl = new FormControl<boolean>(true);
  observacionCtrl = new FormControl<string>('', [Validators.maxLength(200)]);

  corteVentasRows: CorteVentaRow[] = [];
  /** Columnas base (cajero). Admin añade Base + Movimientos. */
  private readonly columnasCajero: string[] = [
    'metodoPago',
    'totalVentasSistema',
    'totalEgresosSistema',
    'totalSistema',
    'totalReal',
    'desfase'
  ];
  private readonly columnasAdmin: string[] = [
    'metodoPago',
    'base',
    'totalVentasSistema',
    'totalEgresosSistema',
    'totalMovimientosSistema',
    'totalSistema',
    'totalReal',
    'desfase'
  ];
  displayedColumns: string[] = [...this.columnasCajero];
  esAdmin = false;

  loading = false;
  consultando = false;
  datosConsultados = false;
  cargaInicial = true;

  totalBase = 0;
  totalVentasSistema = 0;
  totalEgresosSistema = 0;
  totalMovimientosSistema = 0;
  totalSistema = 0;
  totalReal = 0;
  totalDesfases = 0;

  fechaIniRespuesta: string | null = null;
  fechaFinRespuesta: string | null = null;
  motivosDesfase: MotivoMovimientoDto[] = [];
  private origenArbol: OrigenFondosArbolItemDto[] = [];
  /** Flag simple para el botón (no evaluar métodos mutables desde el template). */
  puedeRegistrar = false;
  /** Mensaje bajo las acciones cuando el registro está bloqueado. */
  mensajeValidacion = '';

  /** Mientras se edita un total, no reformatear el input (evita cursor jump y strings "1.500.000"). */
  private editingMetodoId: number | null = null;
  private editingRaw = '';

  /** Último conteo asociado en el asistente de efectivo (se rehidrata al reabrir). */
  private conteosAsistenteEfectivo: ConteoBilletes | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<CierreVentasComponent, CierreVentasResultado | null>,
    @Inject(MAT_DIALOG_DATA) data: CierreVentasData,
    private metodoPagoService: MetodoPagoService,
    private corteVentaService: CorteVentaService,
    private motivoMovimientoService: MotivoMovimientoService,
    private origenFondosService: OrigenFondosService,
    private dialog: MatDialog,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.authService.isAdmin();
    this.displayedColumns = this.esAdmin
      ? [...this.columnasAdmin]
      : [...this.columnasCajero];

    this.motivoMovimientoService.findActivos().subscribe({
      next: (motivos) => {
        const todos = motivos ?? [];
        this.motivosDesfase = todos.filter((m) => m.categoria === 'DESFASE_CIERRE');
        if (this.motivosDesfase.length === 0) {
          this.motivosDesfase = todos.filter((m) => m.categoria === 'AJUSTE');
        }
        this.refrescarPuedeRegistrar();
      },
      error: () => {
        this.snackBar.open(
          'No se pudieron cargar los motivos de desfase',
          'Cerrar',
          { duration: 4000 }
        );
        this.refrescarPuedeRegistrar();
      }
    });

    this.origenFondosService.findArbol().subscribe({
      next: (arbol) => {
        this.origenArbol = arbol ?? [];
      },
      error: () => {
        this.origenArbol = [];
      }
    });

    this.desdeUltimoCorteCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        if (checked) {
          this.fechaInicioCtrl.disable();
          this.horaInicioCtrl.disable();
        } else {
          this.fechaInicioCtrl.enable();
          this.horaInicioCtrl.enable();
        }
      });

    this.hastaActualmenteCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(checked => {
        if (checked) {
          this.fechaFinCtrl.disable();
          this.horaFinCtrl.disable();
        } else {
          this.fechaFinCtrl.enable();
          this.horaFinCtrl.enable();
        }
      });

    if (this.desdeUltimoCorteCtrl.value) {
      this.fechaInicioCtrl.disable();
      this.horaInicioCtrl.disable();
    }
    if (this.hastaActualmenteCtrl.value) {
      this.fechaFinCtrl.disable();
      this.horaFinCtrl.disable();
    }

    merge(
      this.fechaInicioCtrl.valueChanges,
      this.horaInicioCtrl.valueChanges,
      this.fechaFinCtrl.valueChanges,
      this.horaFinCtrl.valueChanges
    )
      .pipe(
        debounceTime(450),
        filter(() => !this.cargaInicial),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.consultar());

    this.consultarInicial();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private consultarInicial(): void {
    this.cargaInicial = true;
    this.consultando = true;

    this.metodoPagoService.obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) => {
          this.consultarRangoConMetodos(metodos ?? []);
        },
        error: (err) => {
          console.error('Error cargando métodos de pago', err);
          this.consultando = false;
          this.cargaInicial = false;
          this.snackBar.open('Error al cargar los métodos de pago', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  consultar(): void {
    this.consultando = true;

    this.metodoPagoService.obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) => {
          this.consultarRangoConMetodos(metodos ?? []);
        },
        error: (err) => {
          console.error('Error cargando métodos de pago', err);
          this.consultando = false;
          this.snackBar.open('Error al cargar los métodos de pago', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  private consultarRangoConMetodos(metodos: MetodoPagoDto[]): void {
    const params = {
      fechaIni: this.construirFechaHoraISO(this.fechaInicioCtrl.value, this.horaInicioCtrl.value),
      fechaFin: this.construirFechaHoraISO(this.fechaFinCtrl.value, this.horaFinCtrl.value),
      ultimoCorte: this.desdeUltimoCorteCtrl.value ?? true,
      actual: this.hastaActualmenteCtrl.value ?? true
    };

    this.corteVentaService.consultarRango(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.consultando = false;
          this.cargaInicial = false;
          this.refrescarPuedeRegistrar();
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.procesarRespuestaConsulta(respuesta, metodos);
        },
        error: (err) => {
          console.error('Error consultando rango', err);
          this.datosConsultados = false;
          this.corteVentasRows = [];
          this.puedeRegistrar = false;
          this.mensajeValidacion = 'Error al consultar las ventas.';
          this.snackBar.open('Error al consultar las ventas', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  private procesarRespuestaConsulta(respuesta: ConsultarRangoCorteDto, metodos: MetodoPagoDto[]): void {
    this.fechaIniRespuesta = respuesta.fechaIni;
    this.fechaFinRespuesta = respuesta.fechaFin;

    // Solo reflejar en los inputs lo que el backend resolvió cuando ese extremo no lo edita el usuario.
    if (this.desdeUltimoCorteCtrl.value) {
      this.setearFechaHoraDesdeISO(respuesta.fechaIni, this.fechaInicioCtrl, this.horaInicioCtrl);
    }
    if (this.hastaActualmenteCtrl.value) {
      this.setearFechaHoraDesdeISO(respuesta.fechaFin, this.fechaFinCtrl, this.horaFinCtrl);
    }

    const totalesPorMetodo = new Map<number, {
      base: number;
      totalVentasSistema: number;
      totalEgresosSistema: number;
      totalMovimientosSistema: number;
      totalSistema: number;
    }>();
    (respuesta.ventasTipo ?? []).forEach((vt) => {
      const metodoPagoId = Number(vt.metodoPagoId);
      if (!Number.isFinite(metodoPagoId)) {
        return;
      }
      const base = this.toPesosEnteros(vt.base ?? 0);
      const ventas = this.toPesosEnteros(vt.totalVentasSistema ?? 0);
      const egresos = this.toPesosEnteros(vt.totalEgresosSistema ?? 0);
      const movimientos = this.toPesosEnteros(vt.totalMovimientosSistema ?? 0);
      const neto = this.toPesosEnteros(
        vt.totalSistema ?? base + ventas - egresos + movimientos
      );
      totalesPorMetodo.set(metodoPagoId, {
        base,
        totalVentasSistema: ventas,
        totalEgresosSistema: egresos,
        totalMovimientosSistema: movimientos,
        totalSistema: neto
      });
    });

    // Medios de tickets (+ los que tengan ventas reales en el rango).
    // Excluye catálogo legacy tipo "base proveedores" y bolsillos sin ventas POS.
    const metodosActivos = (metodos ?? []).filter((m) => {
      const id = Number(m.id);
      if (!Number.isFinite(id)) {
        return false;
      }
      const estado = String(m.estado ?? '')
        .trim()
        .toLowerCase();
      const inactivo =
        estado.includes('inactiv') || estado === '0' || estado === 'i';
      const visibleTickets = m.visiblePagoTickets !== false;
      const resumen = totalesPorMetodo.get(id);
      const tieneVentas = (resumen?.totalVentasSistema ?? 0) !== 0;

      if (resumen) {
        // Actividad en el rango: solo mostrar si es medio de tickets o hubo ventas.
        return visibleTickets || tieneVentas;
      }
      if (inactivo || !visibleTickets) {
        return false;
      }
      return true;
    });

    const fuente =
      metodosActivos.length > 0
        ? metodosActivos
        : Array.from(totalesPorMetodo.keys()).map(
            (id) =>
              metodos.find((m) => Number(m.id) === id) ??
              ({
                id,
                descripcion: `Método ${id}`,
                estado: 'A',
                file: '',
                sigla: '',
                color: ''
              } as MetodoPagoDto)
          );

    this.corteVentasRows = fuente.map((metodo) => {
      const resumen = totalesPorMetodo.get(Number(metodo.id));
      const base = this.toPesosEnteros(resumen?.base ?? 0);
      const totalVentasSistema = this.toPesosEnteros(resumen?.totalVentasSistema ?? 0);
      const totalEgresosSistema = this.toPesosEnteros(resumen?.totalEgresosSistema ?? 0);
      const totalMovimientosSistema = this.toPesosEnteros(
        resumen?.totalMovimientosSistema ?? 0
      );
      const totalSistema = this.toPesosEnteros(
        resumen?.totalSistema ??
          base + totalVentasSistema - totalEgresosSistema + totalMovimientosSistema
      );
      // El neto puede ser negativo (p. ej. solo egresos en «base proveedores»).
      // Inicializar el físico con el mismo valor evita un falso desfase y no bloquea el botón.
      const totalRealCtrl = new FormControl<number | null>(totalSistema, {
        nonNullable: false,
        validators: [Validators.required]
      });
      const motivoDesfaseCtrl = new FormControl<number | null>(null);

      totalRealCtrl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.actualizarTotales());

      motivoDesfaseCtrl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.refrescarPuedeRegistrar());

      return {
        metodoPago: metodo,
        base,
        totalVentasSistema,
        totalEgresosSistema,
        totalMovimientosSistema,
        totalSistema,
        totalRealCtrl,
        desfase: 0,
        motivoDesfaseCtrl
      };
    });

    this.totalBase = this.corteVentasRows.reduce((acc, row) => acc + row.base, 0);
    this.totalVentasSistema = this.corteVentasRows.reduce(
      (acc, row) => acc + row.totalVentasSistema,
      0
    );
    this.totalEgresosSistema = this.corteVentasRows.reduce(
      (acc, row) => acc + row.totalEgresosSistema,
      0
    );
    this.totalMovimientosSistema = this.corteVentasRows.reduce(
      (acc, row) => acc + row.totalMovimientosSistema,
      0
    );
    this.totalSistema = this.corteVentasRows.reduce(
      (acc, row) => acc + row.totalSistema,
      0
    );
    this.datosConsultados = true;
    this.actualizarTotales();
  }

  /** Normaliza number | string | BigDecimal-like a pesos enteros. */
  private toPesosEnteros(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.round(value) : 0;
    }
    if (typeof value === 'string') {
      return this.parseCurrency(value);
    }
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  private setearFechaHoraDesdeISO(
    fechaISO: string | null,
    fechaCtrl: FormControl<Date | null>,
    horaCtrl: FormControl<string | null>
  ): void {
    if (!fechaISO) return;

    try {
      // LocalDateTime del backend sin zona: parsear componentes (evitar sesgo UTC).
      const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(fechaISO);
      const dateObj = m
        ? new Date(
            Number(m[1]),
            Number(m[2]) - 1,
            Number(m[3]),
            Number(m[4]),
            Number(m[5])
          )
        : new Date(fechaISO);

      if (!isNaN(dateObj.getTime())) {
        fechaCtrl.setValue(dateObj, { emitEvent: false });

        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        horaCtrl.setValue(`${hours}:${minutes}`, { emitEvent: false });
      }
    } catch (e) {
      console.error('Error parseando fecha ISO:', fechaISO, e);
    }
  }

  private construirFechaHoraISO(fecha: Date | null, hora: string | null): string {
    const f = fecha ?? new Date();
    const h = hora ?? '00:00';
    const year = f.getFullYear();
    const month = String(f.getMonth() + 1).padStart(2, '0');
    const day = String(f.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${h}:00`;
  }

  actualizarTotales(): void {
    this.totalReal = 0;
    this.totalDesfases = 0;

    this.corteVentasRows.forEach((row) => {
      let totalReal = this.asMonto(row.totalRealCtrl.value);
      if (totalReal === null) {
        totalReal = 0;
        row.totalRealCtrl.setValue(0, { emitEvent: false });
      } else if (typeof row.totalRealCtrl.value !== 'number') {
        row.totalRealCtrl.setValue(totalReal, { emitEvent: false });
      }
      row.desfase = this.calcularDesfase(totalReal, row.totalSistema);
      this.totalReal += totalReal;
      this.totalDesfases += row.desfase;
      if (!this.tieneDesfase(row.desfase)) {
        if (row.motivoDesfaseCtrl.value !== null) {
          row.motivoDesfaseCtrl.setValue(null, { emitEvent: false });
        }
        row.motivoDesfaseCtrl.clearValidators();
      } else {
        row.motivoDesfaseCtrl.setValidators([Validators.required]);
      }
      row.motivoDesfaseCtrl.updateValueAndValidity({ emitEvent: false });
    });
    this.refrescarPuedeRegistrar();
  }

  /** Normaliza number | string formateado ("1.500.000") a pesos enteros. */
  asMonto(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.round(value) : null;
    }
    const parsed = this.parseCurrency(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }

  /** Desfase en pesos enteros (evita residuos decimales que bloquean el registro). */
  private calcularDesfase(totalReal: number, totalSistema: number): number {
    return Math.round(totalReal) - Math.round(Number(totalSistema) || 0);
  }

  tieneDesfase(desfase: number): boolean {
    return tieneDesfaseCierre(desfase);
  }

  onMotivoDesfaseChange(row: CorteVentaRow, event: MatSelectChange): void {
    const raw = event.value;
    const motivoId =
      raw === null || raw === undefined || raw === ''
        ? null
        : Number(raw);
    row.motivoDesfaseCtrl.setValue(
      motivoId !== null && Number.isFinite(motivoId) && motivoId > 0
        ? motivoId
        : null,
      { emitEvent: false }
    );
    this.refrescarPuedeRegistrar();
  }

  compareMotivoId = (a: unknown, b: unknown): boolean => {
    if (a == null && b == null) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return Number(a) === Number(b);
  };

  /**
   * Recalcula el flag del botón. Solo se llama desde handlers / finalize,
   * nunca desde el template (evita mutaciones durante CD en MatDialog).
   */
  refrescarPuedeRegistrar(): void {
    const resultado = this.evaluarPuedeRegistrar();
    this.puedeRegistrar = resultado.ok;
    this.mensajeValidacion = resultado.mensaje;
    this.cdr.markForCheck();
  }

  private evaluarPuedeRegistrar(): { ok: boolean; mensaje: string } {
    if (this.consultando) {
      return { ok: false, mensaje: 'Espere a que termine la consulta.' };
    }
    if (!this.datosConsultados) {
      return { ok: false, mensaje: 'Consulte el rango antes de registrar.' };
    }
    if (this.corteVentasRows.length === 0) {
      return {
        ok: false,
        mensaje: 'No hay medios de pago para registrar en este rango.'
      };
    }
    if (this.observacionCtrl.invalid) {
      return {
        ok: false,
        mensaje: 'La observación no puede superar 200 caracteres.'
      };
    }

    const pendientesMotivo: string[] = [];
    for (const row of this.corteVentasRows) {
      const totalReal = this.asMonto(row.totalRealCtrl.value);
      // Permitir neto/real negativo (medios con más egresos que ventas).
      if (totalReal === null || !Number.isFinite(totalReal)) {
        return {
          ok: false,
          mensaje: 'Complete el total físico / real en todos los medios.'
        };
      }
      const desfase = this.calcularDesfase(totalReal, row.totalSistema);
      row.desfase = desfase;
      if (this.tieneDesfase(desfase) && !this.tieneMotivoSeleccionado(row)) {
        pendientesMotivo.push(
          row.metodoPago.descripcion ||
            row.metodoPago.descripcionEgreso ||
            `Método ${row.metodoPago.id}`
        );
      }
    }

    if (pendientesMotivo.length > 0) {
      if (this.motivosDesfase.length === 0) {
        return {
          ok: false,
          mensaje:
            'Hay desfase pero no hay motivos cargados. Revise /motivos-movimiento (categoría DESFASE_CIERRE).'
        };
      }
      return {
        ok: false,
        mensaje: `Seleccione el motivo de desfase en: ${pendientesMotivo.join(', ')}.`
      };
    }

    const bloqueadosDocumento: string[] = [];
    for (const row of this.corteVentasRows) {
      if (!this.tieneDesfase(row.desfase) || !this.tieneMotivoSeleccionado(row)) {
        continue;
      }
      if (this.accionEsperadaMotivo(row) === 'REGISTRAR_DOCUMENTO') {
        bloqueadosDocumento.push(
          row.metodoPago.descripcion ||
            row.metodoPago.descripcionEgreso ||
            `Método ${row.metodoPago.id}`
        );
      }
    }
    if (bloqueadosDocumento.length > 0) {
      return {
        ok: false,
        mensaje:
          `El motivo exige registrar el egreso/movimiento faltante, volver a consultar ` +
          `y, si aún hay diferencia, usar otro motivo (p. ej. error de conteo). ` +
          `Medios: ${bloqueadosDocumento.join(', ')}.`
      };
    }

    return { ok: true, mensaje: '' };
  }

  private motivoSeleccionado(row: CorteVentaRow): MotivoMovimientoDto | undefined {
    const id = row.motivoDesfaseCtrl.value;
    if (id == null) {
      return undefined;
    }
    return this.motivosDesfase.find((x) => x.id === Number(id));
  }

  private accionEsperadaMotivo(row: CorteVentaRow): string {
    return (this.motivoSeleccionado(row)?.accionEsperada || '').trim().toUpperCase();
  }

  /** CTA para reclasificar medio vía traslado OF (ERROR_MEDIO_PAGO). */
  requiereTrasladoOf(row: CorteVentaRow): boolean {
    return (
      this.tieneDesfase(row.desfase) &&
      this.accionEsperadaMotivo(row) === 'TRASLADO_OF'
    );
  }

  abrirTrasladoOf(row: CorteVentaRow): void {
    if (!this.origenArbol.length) {
      this.snackBar.open(
        'No hay orígenes de fondos cargados. Abra Orígenes de fondos o reintente.',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }
    const mpId = Number(row.metodoPago.id);
    const cuenta = this.origenArbol.find(
      (o) => o.metodoPagoId != null && Number(o.metodoPagoId) === mpId
    );
    const ref = this.dialog.open(OrigenMovimientoDialogComponent, {
      width: '520px',
      data: {
        tipo: 'traslado' as const,
        cuentaId: cuenta?.id,
        arbol: this.origenArbol,
        ventasSinCortePorMetodo: new Map(
          this.corteVentasRows.map((r) => [
            Number(r.metodoPago.id),
            Number(r.totalVentasSistema) || 0
          ])
        )
      }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.snackBar.open(
          'Traslado registrado. Vuelva a consultar el rango para actualizar Esperado.',
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }

  esFilaEfectivo(row: CorteVentaRow): boolean {
    const sigla = (row.metodoPago.sigla || '').trim().toUpperCase();
    const nombre = (row.metodoPago.descripcion || '').trim().toLowerCase();
    return sigla === 'EF' || nombre === 'efectivo';
  }

  abrirAsistenteCierreCaja(row: CorteVentaRow): void {
    if (!this.esFilaEfectivo(row)) {
      return;
    }
    const ref = this.dialog.open(AsistenteCierreCajaDialogComponent, {
      width: '480px',
      autoFocus: 'first-tabbable',
      panelClass: 'asistente-cierre-caja-pane',
      position: {
        top: '72px',
        right: '24px'
      },
      data: {
        conteosPrevios: this.conteosAsistenteEfectivo,
        esperado: row.totalSistema
      }
    });
    ref.afterClosed().subscribe((resultado: AsistenteCierreCajaResultado | null) => {
      if (!resultado) {
        return;
      }
      this.conteosAsistenteEfectivo = resultado.conteos;
      this.editingMetodoId = null;
      this.editingRaw = '';
      row.totalRealCtrl.setValue(resultado.contado);
      this.actualizarTotales();
      this.cdr.markForCheck();
    });
  }

  private tieneMotivoSeleccionado(row: CorteVentaRow): boolean {
    const v = row.motivoDesfaseCtrl.value as unknown;
    if (v === null || v === undefined || v === '') {
      return false;
    }
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
  }

  getDesfaseClass(desfase: number): string {
    return claseDesfaseCierre(desfase);
  }

  getDesfaseTexto(desfase: number): string {
    return textoDesfaseCierre(desfase, (n) => this.formatCurrency(n));
  }

  hintAccionMotivo(row: CorteVentaRow): string | null {
    const m = this.motivoSeleccionado(row);
    if (!m) {
      return null;
    }
    switch (this.accionEsperadaMotivo(row)) {
      case 'TRASLADO_OF':
        return 'Acción: reclasificar con traslado entre orígenes de fondos.';
      case 'REGISTRAR_DOCUMENTO':
        return 'Bloqueado: registre el egreso/movimiento, consulte de nuevo y use otro motivo si queda diferencia.';
      case 'AJUSTE_CIERRE':
        return 'Acción: se aplicará ajuste de cierre (over/short) en caja.';
      case 'REVISAR':
        return 'Acción: revisar y preferir reclasificar o documentar.';
      default:
        return m.codigo ? `Motivo: ${m.codigo}` : null;
    }
  }

  getTotalDesfaseClass(): string {
    return claseDesfaseCierre(this.totalDesfases);
  }

  formatearFecha(fecha: Date | null): string {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('COP', '$').trim();
  }

  /** Egresos = salida de O.F.: se muestran con signo negativo (solo UI). */
  formatCurrencyEgreso(value: number | null | undefined): string {
    const n = value ?? 0;
    if (n === 0) {
      return this.formatCurrency(0);
    }
    return this.formatCurrency(-Math.abs(n));
  }

  /** Valor mostrado dentro del input: solo número formateado (el $ va en matPrefix). */
  private formatMontoInput(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  parseCurrency(value: string | null | undefined): number {
    if (!value) return 0;
    const cleaned = String(value).replace(/\s+/g, '');
    const negative = cleaned.startsWith('-');
    const unsigned = cleaned.replace(/^-/, '');
    // Decimal simple API/JS: "1500.50" o "1500,50"
    if (/^\d([.,]\d{1,2})?$/.test(unsigned) || /^\d+[.,]\d{1,2}$/.test(unsigned)) {
      const n = Number(unsigned.replace(',', '.'));
      if (!Number.isFinite(n)) return 0;
      return Math.round(negative ? -n : n);
    }
    // Miles es-CO: "1.500.000" o "1.500.000,50"
    if (unsigned.includes(',')) {
      const [enteros, dec = ''] = unsigned.split(',');
      const enterosNum = enteros.replace(/[^\d]/g, '');
      const decNum = dec.replace(/[^\d]/g, '').slice(0, 2);
      const n = Number(`${enterosNum}.${decNum || '0'}`);
      if (!Number.isFinite(n)) return 0;
      return Math.round(negative ? -n : n);
    }
    // Solo dígitos y puntos de miles: "1.500.000"
    const digits = unsigned.replace(/[^\d]/g, '');
    if (!digits) return 0;
    const n = Number(digits);
    return negative ? -n : n;
  }

  esFormularioValido(): boolean {
    return this.puedeRegistrar;
  }

  registrar(): void {
    this.refrescarPuedeRegistrar();
    if (!this.puedeRegistrar) {
      this.snackBar.open(
        this.mensajeValidacion || 'Complete el formulario antes de registrar',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    const ventasTipo = this.corteVentasRows
      .filter(
        (row) =>
          row.totalRealCtrl.value !== null &&
          row.totalRealCtrl.value !== undefined &&
          (row.totalRealCtrl.value > 0 ||
            row.totalSistema !== 0 ||
            this.tieneDesfase(row.desfase))
      )
      .map((row) => ({
        metodoPagoId: row.metodoPago.id,
        total: this.asMonto(row.totalRealCtrl.value) ?? 0,
        totalSistema: row.totalSistema,
        totalVentasSistema: row.totalVentasSistema,
        totalEgresosSistema: row.totalEgresosSistema,
        totalMovimientosSistema: row.totalMovimientosSistema,
        base: row.base,
        desfase: row.desfase,
        motivoDesfaseId: this.tieneDesfase(row.desfase)
          ? Number(row.motivoDesfaseCtrl.value)
          : null
      }));

    if (ventasTipo.length === 0) {
      this.snackBar.open('Debe ingresar al menos un valor mayor a cero', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const fechaIni = this.construirFechaHoraISO(this.fechaInicioCtrl.value, this.horaInicioCtrl.value);
    const fechaFin = this.construirFechaHoraISO(this.fechaFinCtrl.value, this.horaFinCtrl.value);

    const payload = {
      fechaIni,
      fechaFin,
      total: this.totalReal,
      totalSistema: this.totalSistema,
      ultimoCorte: this.desdeUltimoCorteCtrl.value ?? false,
      actual: this.hastaActualmenteCtrl.value ?? false,
      observacion: this.observacionCtrl.value?.trim() || null,
      ventasTipo,
      detalles: this.corteVentasRows.map((row, orden) => ({
        metodoPagoId: row.metodoPago.id,
        origenFondosId: null,
        base: row.base,
        totalVentasSistema: row.totalVentasSistema,
        totalEgresosSistema: row.totalEgresosSistema,
        totalMovimientosSistema: row.totalMovimientosSistema,
        totalSistema: row.totalSistema,
        total: this.asMonto(row.totalRealCtrl.value) ?? 0,
        desfase: row.desfase,
        motivoDesfaseId: this.tieneDesfase(row.desfase)
          ? Number(row.motivoDesfaseCtrl.value)
          : null,
        modoCaptura: 'DECLARADO_CAJERO' as const,
        revisionEstado: 'PENDIENTE' as const,
        orden
      }))
    };

    this.loading = true;

    this.corteVentaService.registrarCorte(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (corte) => {
          this.snackBar.open(
            'Se registró el cierre de ventas correctamente',
            'Cerrar',
            { duration: 3000 }
          );
          const esAdmin = this.authService.isAdmin();
          this.dialogRef.close({
            success: true,
            registrosCreados: ventasTipo.length,
            corteVentaId: corte?.id,
            abrirDistribucion: esAdmin,
            requiereLogout: !esAdmin
          });
        },
        error: (err) => {
          console.error('Error registrando cierre de ventas', err);
          const msg =
            err?.error?.message ||
            'Error al registrar el cierre de ventas. Por favor intente nuevamente.';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        }
      });
  }

  onTotalRealInput(event: Event, row: CorteVentaRow): void {
    const input = event.target as HTMLInputElement;
    this.editingMetodoId = row.metodoPago.id;
    this.editingRaw = input.value;
    row.totalRealCtrl.setValue(this.parseCurrency(input.value), { emitEvent: false });
    this.actualizarTotales();
  }

  displayTotalReal(row: CorteVentaRow): string {
    if (this.editingMetodoId === row.metodoPago.id) {
      return this.editingRaw;
    }
    const monto = this.asMonto(row.totalRealCtrl.value);
    if (monto === null) {
      return '';
    }
    return this.formatMontoInput(monto);
  }

  onTotalRealFocus(event: Event, row: CorteVentaRow): void {
    const input = event.target as HTMLInputElement;
    const monto = this.asMonto(row.totalRealCtrl.value);
    this.editingMetodoId = row.metodoPago.id;
    this.editingRaw = monto !== null ? String(monto) : '';
    input.value = this.editingRaw;
  }

  onTotalRealBlur(event: Event, row: CorteVentaRow): void {
    const input = event.target as HTMLInputElement;
    const monto = this.parseCurrency(input.value);
    row.totalRealCtrl.setValue(monto, { emitEvent: false });
    this.editingMetodoId = null;
    this.editingRaw = '';
    input.value = this.formatMontoInput(monto);
    this.actualizarTotales();
  }

  onTotalRealKeydown(event: KeyboardEvent, row: CorteVentaRow, index: number): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (event.key.match(/[0-9.\-]/)) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    event.preventDefault();
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  trackByMetodoPagoId(_index: number, row: CorteVentaRow): number {
    return row.metodoPago.id;
  }
}
