import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  CorteVentaSearchItemDto,
  CorteVentaService,
  DistribucionOriginalCorteDto,
  DividirCorteParticionDto,
  VentaTipoCorteDto
} from '../../../ventas/service/corte-venta.service';
import { MetodoPagoDto, MetodoPagoService } from '../../../ventas/service/metodo-pago.service';

export interface DividirCorteDialogData {
  corte: CorteVentaSearchItemDto;
}

export interface DividirCorteDialogResult {
  confirmado: boolean;
  tipo?: 'SPLIT' | 'EDICION';
}

interface ParticionPreview {
  consultado: boolean;
  cargando: boolean;
  ventasTipo: VentaTipoCorteDto[];
  totalVentasSistema: number;
  montoMenorTocado: boolean;
  montoGeneralTocado: boolean;
}

/**
 * Asistente "Dividir" (SPLIT): corrige un corte mal generado.
 * 1 partición (rango completo, sin editar fechas) = edición trazada (tipo EDICION), sin tocar
 * el ledger. 2+ particiones = SPLIT completo en backend (reverso + puente + re-corte); el
 * backend valida que el prorrateo a Caja Menor/General sume exactamente lo distribuido
 * originalmente por el corte.
 */
@Component({
  selector: 'vex-dividir-corte-dialog',
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    DragDropModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dividir-corte-dialog.component.html',
  styleUrl: './dividir-corte-dialog.component.scss'
})
export class DividirCorteDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  guardando = false;
  cargandoInicial = true;
  readonly corte: CorteVentaSearchItemDto;
  previews: ParticionPreview[] = [];

  montoMenorOriginal = 0;
  montoGeneralOriginal = 0;
  private metodos: MetodoPagoDto[] = [];
  private efectivoMetodoPagoId: number | null = null;
  /** Ventas en efectivo del corte completo, para prorratear proporcionalmente por partición. */
  private totalEfectivoOriginal = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DividirCorteDialogComponent, DividirCorteDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: DividirCorteDialogData,
    private corteVentaService: CorteVentaService,
    private metodoPagoService: MetodoPagoService,
    private snackBar: MatSnackBar
  ) {
    this.corte = data.corte;
    this.form = this.fb.group({
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      particiones: this.fb.array([
        this.crearParticion(this.parseIso(this.corte.fechaIni), this.parseIso(this.corte.fechaFin))
      ])
    });
    this.previews = [this.previewVacio()];
  }

  ngOnInit(): void {
    forkJoin({
      metodos: this.metodoPagoService.obtenerMetodosPago(),
      distribucion: this.corteVentaService.obtenerDistribucionOriginal(this.corte.id),
      totalCorte: this.corteVentaService.consultarRango({
        fechaIni: this.corte.fechaIni,
        fechaFin: this.corte.fechaFin,
        ultimoCorte: false,
        actual: false
      })
    })
      .pipe(takeUntil(this.destroy$), finalize(() => (this.cargandoInicial = false)))
      .subscribe({
        next: ({ metodos, distribucion, totalCorte }) => {
          this.montoMenorOriginal = Number(distribucion.montoCajaMenor) || 0;
          this.montoGeneralOriginal = Number(distribucion.montoCajaGeneral) || 0;
          this.metodos = metodos ?? [];
          this.efectivoMetodoPagoId = this.buscarIdEfectivo(metodos);
          this.totalEfectivoOriginal = this.ventasEfectivoDe(totalCorte.ventasTipo ?? []);
        },
        error: () => {
          this.snackBar.open(
            'No se pudo cargar la distribución original del corte. El prorrateo no se prellenará.',
            'Cerrar',
            { duration: 6000 }
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get particiones(): FormArray {
    return this.form.get('particiones') as FormArray;
  }

  get esSplit(): boolean {
    return this.particiones.length > 1;
  }

  get sumaMenor(): number {
    return this.particiones.controls.reduce(
      (acc, c) => acc + (Number(c.get('montoCajaMenor')!.value) || 0),
      0
    );
  }

  get sumaGeneral(): number {
    return this.particiones.controls.reduce(
      (acc, c) => acc + (Number(c.get('montoCajaGeneral')!.value) || 0),
      0
    );
  }

  get menorCuadra(): boolean {
    return Math.round(this.sumaMenor) === Math.round(this.montoMenorOriginal);
  }

  get generalCuadra(): boolean {
    return Math.round(this.sumaGeneral) === Math.round(this.montoGeneralOriginal);
  }

  private previewVacio(): ParticionPreview {
    return {
      consultado: false,
      cargando: false,
      ventasTipo: [],
      totalVentasSistema: 0,
      montoMenorTocado: false,
      montoGeneralTocado: false
    };
  }

  /**
   * Todas las fechas son editables: el admin controla en qué día calendario cae cada corte nuevo
   * (Ingresos agrupa por la fecha de inicio del corte). Se permiten huecos entre particiones
   * (p. ej. 23:59:59 → 00:00:00 del día siguiente); el backend valida que no se solapen y que,
   * entre todas, cubran exactamente las ventas del corte original.
   */
  private crearParticion(desde: Date, hasta: Date): FormGroup {
    return this.fb.group({
      fechaDesde: new FormControl<Date | null>(desde, { validators: Validators.required }),
      horaDesde: new FormControl<string | null>(this.horaDe(desde)),
      fechaHasta: new FormControl<Date | null>(hasta, { validators: Validators.required }),
      horaHasta: new FormControl<string | null>(this.horaDe(hasta)),
      montoCajaMenor: [0],
      montoCajaGeneral: [0]
    });
  }

  /**
   * Agrega una partición: la última existente cede su tramo final y la nueva cierra hasta el fin
   * del corte original. El corte sugerido es el fin del día (23:59:59) / inicio del siguiente
   * (00:00:00), que es el caso típico; el admin puede ajustar ambas fechas libremente.
   */
  agregarParticion(): void {
    const idxUltima = this.particiones.length - 1;
    const ultima = this.particiones.at(idxUltima) as FormGroup;
    const desdeUltima = ultima.get('fechaDesde')!.value as Date;
    const finOriginal = this.parseIso(this.corte.fechaFin);

    // Sugerencia inicial: cortar al final del día de la partición actual (23:59:59) y arrancar
    // la nueva al inicio del día siguiente (00:00:00), que es el caso típico de "un corte por día".
    // El admin puede cambiar ambas fechas después.
    const finDia = this.finDelDia(desdeUltima);
    const cortaEnFinDeDia = finDia.getTime() < finOriginal.getTime();
    const hastaSugerida = cortaEnFinDeDia ? finDia : this.puntoMedio(desdeUltima, finOriginal);
    const desdeSugerida = cortaEnFinDeDia
      ? this.inicioDelDiaSiguiente(desdeUltima)
      : hastaSugerida;

    ultima.get('fechaHasta')!.setValue(hastaSugerida);
    ultima.get('horaHasta')!.setValue(this.horaDe(hastaSugerida));
    this.previews[idxUltima] = this.previewVacio();

    this.particiones.push(this.crearParticion(desdeSugerida, finOriginal));
    this.previews.push(this.previewVacio());
  }

  eliminarParticion(index: number): void {
    if (this.particiones.length <= 1) {
      return;
    }
    const eraUltima = index === this.particiones.length - 1;
    this.particiones.removeAt(index);
    this.previews.splice(index, 1);
    if (eraUltima) {
      // La nueva última debe seguir llegando hasta el fin del corte original.
      const ultima = this.particiones.at(this.particiones.length - 1) as FormGroup;
      const finOriginal = this.parseIso(this.corte.fechaFin);
      ultima.get('fechaHasta')!.setValue(finOriginal);
      ultima.get('horaHasta')!.setValue(this.horaDe(finOriginal));
      this.previews[this.particiones.length - 1] = this.previewVacio();
    }
  }

  /** Cambiar una fecha invalida el resumen consultado de esa partición (hay que volver a consultar). */
  onFechaChange(index: number): void {
    this.previews[index] = this.previewVacio();
  }

  onMontoTocado(index: number, campo: 'montoCajaMenor' | 'montoCajaGeneral'): void {
    if (campo === 'montoCajaMenor') {
      this.previews[index].montoMenorTocado = true;
    } else {
      this.previews[index].montoGeneralTocado = true;
    }
  }

  consultarParticion(index: number): void {
    const grupo = this.particiones.at(index) as FormGroup;
    const fechaIni = this.construirIso(grupo.get('fechaDesde')!.value, grupo.get('horaDesde')!.value);
    const fechaFin = this.construirIso(grupo.get('fechaHasta')!.value, grupo.get('horaHasta')!.value);
    if (new Date(fechaFin).getTime() <= new Date(fechaIni).getTime()) {
      this.snackBar.open('"Hasta" debe ser posterior a "Desde" en esta partición.', 'Cerrar', {
        duration: 4000
      });
      return;
    }
    this.previews[index].cargando = true;
    this.corteVentaService
      .consultarRango({ fechaIni, fechaFin, ultimoCorte: false, actual: false })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta) => {
          const preview = this.previews[index];
          preview.cargando = false;
          preview.consultado = true;
          preview.ventasTipo = respuesta.ventasTipo ?? [];
          preview.totalVentasSistema = Number(respuesta.totalVentasSistema) || 0;
          this.prellenarProrrateo(index);
        },
        error: () => {
          this.previews[index].cargando = false;
          this.snackBar.open('No se pudo consultar las ventas de esta partición.', 'Cerrar', {
            duration: 5000
          });
        }
      });
  }

  /** true si el destino tuvo distribución en el corte original (si no, se oculta el campo). */
  mostrarMenor(): boolean {
    return this.montoMenorOriginal > 0;
  }

  mostrarGeneral(): boolean {
    return this.montoGeneralOriginal > 0;
  }

  esUltima(index: number): boolean {
    return index === this.particiones.length - 1;
  }

  private prellenarProrrateo(index: number): void {
    const esUltima = this.esUltima(index);
    const grupo = this.particiones.at(index) as FormGroup;
    const preview = this.previews[index];

    if (esUltima) {
      // La última partición cierra por resta, siempre (para cuadrar exacto al centavo).
      if (this.mostrarMenor()) {
        grupo.get('montoCajaMenor')!.setValue(this.restanteMenor(index));
      }
      if (this.mostrarGeneral()) {
        grupo.get('montoCajaGeneral')!.setValue(this.restanteGeneral(index));
      }
      return;
    }
    if (this.totalEfectivoOriginal <= 0) {
      return;
    }
    const efectivoParticion = this.ventasEfectivoDe(preview.ventasTipo);
    const proporcion = efectivoParticion / this.totalEfectivoOriginal;
    if (this.mostrarMenor() && !preview.montoMenorTocado) {
      grupo.get('montoCajaMenor')!.setValue(Math.round(this.montoMenorOriginal * proporcion));
    }
    if (this.mostrarGeneral() && !preview.montoGeneralTocado) {
      grupo.get('montoCajaGeneral')!.setValue(Math.round(this.montoGeneralOriginal * proporcion));
    }
    // La última partición depende de esta: recalcular su resto si ya fue consultada.
    const idxUltima = this.particiones.length - 1;
    if (this.previews[idxUltima]?.consultado) {
      this.prellenarProrrateo(idxUltima);
    }
  }

  private restanteMenor(indexUltima: number): number {
    let suma = 0;
    for (let i = 0; i < indexUltima; i++) {
      suma += Number((this.particiones.at(i) as FormGroup).get('montoCajaMenor')!.value) || 0;
    }
    return Math.max(0, Math.round(this.montoMenorOriginal - suma));
  }

  private restanteGeneral(indexUltima: number): number {
    let suma = 0;
    for (let i = 0; i < indexUltima; i++) {
      suma += Number((this.particiones.at(i) as FormGroup).get('montoCajaGeneral')!.value) || 0;
    }
    return Math.max(0, Math.round(this.montoGeneralOriginal - suma));
  }

  private ventasEfectivoDe(ventasTipo: VentaTipoCorteDto[]): number {
    if (this.efectivoMetodoPagoId == null) {
      return 0;
    }
    const item = (ventasTipo ?? []).find(
      (vt) => Number(vt.metodoPagoId) === this.efectivoMetodoPagoId
    );
    return Number(item?.totalVentasSistema ?? 0) || 0;
  }

  nombreMetodo(metodoPagoId: number): string {
    const m = this.metodos.find((x) => Number(x.id) === Number(metodoPagoId));
    return m?.descripcion ?? `Método #${metodoPagoId}`;
  }

  private buscarIdEfectivo(metodos: MetodoPagoDto[]): number | null {
    const match = (metodos ?? []).find((m) => /efectivo/i.test(m.descripcion ?? ''));
    return match ? Number(match.id) : null;
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.snackBar.open('Complete el motivo y las fechas de cada partición.', 'Cerrar', {
        duration: 5000
      });
      return;
    }
    const motivo = (this.form.get('motivo')!.value as string)?.trim();
    if (!motivo) {
      this.snackBar.open('El motivo es obligatorio.', 'Cerrar', { duration: 5000 });
      return;
    }
    if (this.esSplit && (!this.menorCuadra || !this.generalCuadra)) {
      this.snackBar.open(
        'El prorrateo a Caja Menor/Caja General debe sumar exactamente el monto original distribuido.',
        'Cerrar',
        { duration: 7000 }
      );
      return;
    }

    const particiones: DividirCorteParticionDto[] = this.particiones.controls.map((c) => {
      const g = c as FormGroup;
      return {
        fechaDesde: this.construirIso(g.get('fechaDesde')!.value, g.get('horaDesde')!.value),
        fechaHasta: this.construirIso(g.get('fechaHasta')!.value, g.get('horaHasta')!.value),
        montoCajaMenor: Number(g.get('montoCajaMenor')!.value) || 0,
        montoCajaGeneral: Number(g.get('montoCajaGeneral')!.value) || 0
      };
    });
    const error = this.validarRangos(particiones);
    if (error) {
      this.snackBar.open(error, 'Cerrar', { duration: 7000 });
      return;
    }

    this.guardando = true;
    this.corteVentaService
      .dividir(this.corte.id, { motivo, particiones })
      .pipe(takeUntil(this.destroy$), finalize(() => (this.guardando = false)))
      .subscribe({
        next: (resultado) => {
          this.snackBar.open(
            resultado.tipo === 'SPLIT'
              ? `Corte dividido en ${resultado.cortesNuevosIds.length} cortes nuevos`
              : 'Edición registrada',
            undefined,
            { duration: 3000 }
          );
          this.dialogRef.close({ confirmado: true, tipo: resultado.tipo });
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.errores?.[0]?.descripcionError ||
            'No se pudo dividir/editar el corte.';
          this.snackBar.open(msg, 'Cerrar', { duration: 8000 });
        }
      });
  }

  cerrar(): void {
    this.dialogRef.close({ confirmado: false });
  }

  /**
   * Valida lo mismo que el backend antes de enviar: cada partición dentro del rango del corte
   * original, "Hasta" posterior a "Desde" y sin solapamiento entre particiones. Los huecos SÍ se
   * permiten (es lo que deja a cada corte nuevo en su propio día).
   */
  private validarRangos(particiones: DividirCorteParticionDto[]): string | null {
    const iniOriginal = new Date(this.corte.fechaIni).getTime();
    const finOriginal = new Date(this.corte.fechaFin).getTime();
    for (let i = 0; i < particiones.length; i++) {
      const desde = new Date(particiones[i].fechaDesde).getTime();
      const hasta = new Date(particiones[i].fechaHasta).getTime();
      if (hasta <= desde) {
        return `Partición ${i + 1}: "Hasta" debe ser posterior a "Desde".`;
      }
      if (desde < iniOriginal) {
        return `Partición ${i + 1}: no puede iniciar antes del corte original.`;
      }
      if (hasta > finOriginal) {
        return `Partición ${i + 1}: no puede terminar después del corte original.`;
      }
      if (i > 0 && desde < new Date(particiones[i - 1].fechaHasta).getTime()) {
        return `Partición ${i + 1}: se solapa con la anterior.`;
      }
    }
    return null;
  }

  /** Mismo día, 23:59:59. */
  private finDelDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  }

  /** Día siguiente, 00:00:00. */
  private inicioDelDiaSiguiente(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
  }

  private horaDe(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /** LocalDateTime del backend sin zona: parsear componentes (evitar sesgo UTC). */
  private parseIso(iso: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(iso ?? '');
    if (!m) {
      return new Date(iso);
    }
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      m[6] ? Number(m[6]) : 0
    );
  }

  /** La fecha aporta Y/M/D y el input de hora aporta HH:mm:ss (con segundos, step=1). */
  private construirIso(fecha: Date | null, hora: string | null): string {
    const f = fecha ?? new Date();
    let h = String(hora ?? '00:00:00').trim();
    if (/^\d{2}:\d{2}$/.test(h)) {
      h = `${h}:00`;
    }
    const year = f.getFullYear();
    const month = String(f.getMonth() + 1).padStart(2, '0');
    const day = String(f.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${h}`;
  }

  private puntoMedio(desde: Date, hasta: Date): Date {
    const medio = new Date(desde.getTime() + Math.round((hasta.getTime() - desde.getTime()) / 2));
    medio.setSeconds(0, 0);
    return medio;
  }
}
