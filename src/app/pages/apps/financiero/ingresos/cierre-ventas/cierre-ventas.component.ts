import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, merge } from 'rxjs';
import { takeUntil, finalize, debounceTime, filter } from 'rxjs/operators';
import { MetodoPagoService, MetodoPagoDto } from '../../../ventas/service/metodo-pago.service';
import { CorteVentaService, ConsultarRangoCorteDto } from '../../../ventas/service/corte-venta.service';

export interface CierreVentasData {}

export interface CierreVentasResultado {
  success: boolean;
  registrosCreados: number;
}

interface CorteVentaRow {
  metodoPago: MetodoPagoDto;
  totalSistema: number;
  totalRealCtrl: FormControl<number | null>;
  desfase: number;
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

  corteVentasRows: CorteVentaRow[] = [];
  displayedColumns: string[] = ['metodoPago', 'totalSistema', 'totalReal', 'desfase'];

  loading = false;
  consultando = false;
  datosConsultados = false;
  cargaInicial = true;

  totalSistema = 0;
  totalReal = 0;
  totalDesfases = 0;

  fechaIniRespuesta: string | null = null;
  fechaFinRespuesta: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<CierreVentasComponent, CierreVentasResultado | null>,
    @Inject(MAT_DIALOG_DATA) data: CierreVentasData,
    private metodoPagoService: MetodoPagoService,
    private corteVentaService: CorteVentaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.procesarRespuestaConsulta(respuesta, metodos);
        },
        error: (err) => {
          console.error('Error consultando rango', err);
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

    const totalesPorMetodo = new Map<number, number>();
    respuesta.ventasTipo.forEach(vt => {
      totalesPorMetodo.set(vt.metodoPagoId, vt.totalSistema);
    });

    this.corteVentasRows = metodos.map(metodo => {
      const totalSistema = totalesPorMetodo.get(metodo.id) || 0;
      const totalRealCtrl = new FormControl<number | null>(totalSistema, [
        Validators.required,
        Validators.min(0)
      ]);

      totalRealCtrl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.actualizarTotales());

      return {
        metodoPago: metodo,
        totalSistema,
        totalRealCtrl,
        desfase: 0
      };
    });

    this.totalSistema = respuesta.total;
    this.datosConsultados = true;
    this.actualizarTotales();
  }

  private setearFechaHoraDesdeISO(
    fechaISO: string | null,
    fechaCtrl: FormControl<Date | null>,
    horaCtrl: FormControl<string | null>
  ): void {
    if (!fechaISO) return;

    try {
      const dateObj = new Date(fechaISO);

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

    this.corteVentasRows.forEach(row => {
      const totalReal = row.totalRealCtrl.value ?? 0;
      row.desfase = totalReal - row.totalSistema;
      this.totalReal += totalReal;
      this.totalDesfases += row.desfase;
    });
  }

  getDesfaseClass(desfase: number): string {
    if (desfase === 0) return 'desfase-ok';
    if (desfase > 0) return 'desfase-mas';
    return 'desfase-menos';
  }

  getDesfaseTexto(desfase: number): string {
    if (desfase === 0) return 'Sin desfase';
    const tipo = desfase > 0 ? 'Más' : 'Menos';
    return `Desfase: (${tipo}) ${this.formatCurrency(Math.abs(desfase))}`;
  }

  getTotalDesfaseClass(): string {
    if (this.totalDesfases === 0) return 'desfase-ok';
    if (this.totalDesfases > 0) return 'desfase-mas';
    return 'desfase-menos';
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

  /** Valor mostrado dentro del input: solo número formateado (el $ va en matPrefix). */
  private formatMontoInput(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  parseCurrency(value: string | null | undefined): number {
    if (!value) return 0;
    const digits = String(value)
      .replace(/\s+/g, '')
      .replace(/[^\d]/g, '');
    if (!digits) return 0;
    return Number(digits);
  }

  esFormularioValido(): boolean {
    if (!this.datosConsultados) return false;
    return this.corteVentasRows.every(row => {
      const total = row.totalRealCtrl.value;
      return total !== null && total !== undefined && total >= 0;
    });
  }

  registrar(): void {
    if (!this.esFormularioValido()) {
      this.snackBar.open('Por favor complete todos los campos correctamente', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const ventasTipo = this.corteVentasRows
      .filter(row => row.totalRealCtrl.value !== null && row.totalRealCtrl.value !== undefined && row.totalRealCtrl.value > 0)
      .map(row => ({
        metodoPagoId: row.metodoPago.id,
        total: row.totalRealCtrl.value!,
        totalSistema: row.totalSistema
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
      ventasTipo
    };

    this.loading = true;

    this.corteVentaService.registrarCorte(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Se registró el cierre de ventas correctamente',
            'Cerrar',
            { duration: 3000 }
          );
          this.dialogRef.close({
            success: true,
            registrosCreados: ventasTipo.length
          });
        },
        error: (err) => {
          console.error('Error registrando cierre de ventas', err);
          this.snackBar.open(
            'Error al registrar el cierre de ventas. Por favor intente nuevamente.',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  onTotalRealInput(event: Event, row: CorteVentaRow): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const numericValue = this.parseCurrency(value);

    if (!isNaN(numericValue) && numericValue >= 0) {
      row.totalRealCtrl.setValue(numericValue, { emitEvent: true });
    } else if (value === '' || value === null) {
      row.totalRealCtrl.setValue(null, { emitEvent: true });
    }
  }

  onTotalRealFocus(event: Event, row: CorteVentaRow): void {
    const input = event.target as HTMLInputElement;
    const value = row.totalRealCtrl.value;

    if (value !== null && value !== undefined) {
      input.value = String(value);
    }
  }

  onTotalRealBlur(event: Event, row: CorteVentaRow): void {
    const input = event.target as HTMLInputElement;
    const value = row.totalRealCtrl.value;

    if (value !== null && value !== undefined) {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0) {
        row.totalRealCtrl.setValue(numValue, { emitEvent: false });
        input.value = this.formatMontoInput(numValue);
      }
    } else {
      input.value = '';
    }
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

    if (event.key.match(/[0-9.]/)) {
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
