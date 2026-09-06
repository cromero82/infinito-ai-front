import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  ConfigurationService,
  KEY_CORTE_VENTA_BASE_EFECTIVO
} from '../../../../../auth/service/configuration.service';
import {
  BILLETES_COP,
  BilleteOption
} from '../../../ventas/util/billetes-cop.const';
import {
  claseDesfaseCierre,
  textoDesfaseCierre,
  tieneDesfaseCierre
} from './cierre-desfase.util';

export type ConteoBilletes = Record<number, number>;

export interface AsistenteCierreCajaData {
  conteosPrevios?: ConteoBilletes | null;
  /** Esperado de la fila Efectivo (columna Esperado del cierre). */
  esperado?: number;
}

export interface AsistenteCierreCajaResultado {
  contado: number;
  totalBilletes: number;
  baseSugerida: number;
  conteos: ConteoBilletes;
}

interface FilaBillete {
  billete: BilleteOption;
  cantidadCtrl: FormControl<number | null>;
  rehidratada: boolean;
}

@Component({
  selector: 'vex-asistente-cierre-caja-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DragDropModule
  ],
  templateUrl: './asistente-cierre-caja-dialog.component.html',
  styleUrl: './asistente-cierre-caja-dialog.component.scss'
})
export class AsistenteCierreCajaDialogComponent implements OnInit, OnDestroy {
  readonly filas: FilaBillete[] = BILLETES_COP.map((billete) => ({
    billete,
    cantidadCtrl: new FormControl<number | null>(null, [Validators.min(0)]),
    rehidratada: false
  }));

  cargandoBase = true;
  baseCargada = false;
  guardando = false;
  baseOriginal = 0;
  baseSugerida = 0;
  editingBase = false;
  editingBaseRaw = '';
  readonly esperado: number;

  private readonly conteosPrevios: ConteoBilletes;
  private readonly destroy$ = new Subject<void>();
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  private readonly montoFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  constructor(
    private dialogRef: MatDialogRef<
      AsistenteCierreCajaDialogComponent,
      AsistenteCierreCajaResultado | null
    >,
    @Inject(MAT_DIALOG_DATA) data: AsistenteCierreCajaData | null,
    private configurationService: ConfigurationService,
    private snackBar: MatSnackBar
  ) {
    this.conteosPrevios = { ...(data?.conteosPrevios ?? {}) };
    this.esperado = Math.round(Number(data?.esperado) || 0);
  }

  ngOnInit(): void {
    this.aplicarConteosPrevios();
    this.configurationService
      .obtenerBaseEfectivoSugerida()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ valor, encontrada }) => {
          this.baseOriginal = valor;
          this.baseSugerida = valor;
          this.baseCargada = encontrada;
          this.cargandoBase = false;
        },
        error: () => {
          this.baseOriginal = 0;
          this.baseSugerida = 0;
          this.baseCargada = false;
          this.cargandoBase = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cantidadDe(fila: FilaBillete): number {
    const n = Number(fila.cantidadCtrl.value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  subtotalDe(fila: FilaBillete): number {
    return this.cantidadDe(fila) * fila.billete.valor;
  }

  get totalBilletes(): number {
    return this.filas.reduce((acc, fila) => acc + this.subtotalDe(fila), 0);
  }

  /** Total físico de caja: lo que Cierre de turno llama Contado. */
  get contado(): number {
    return this.totalBilletes;
  }

  /** Equivalente a Ventas − Egresos + Movimientos (total billetes − base). */
  get ventasMenosMovimientos(): number {
    return Math.max(0, this.totalBilletes - this.baseSugerida);
  }

  get hayConteo(): boolean {
    return this.filas.some((fila) => this.cantidadDe(fila) > 0);
  }

  /** Igual que la tabla de medios: Contado (total billetes) − Esperado. */
  get desfase(): number {
    return Math.round(this.contado) - this.esperado;
  }

  getDesfaseClass(desfase: number): string {
    return claseDesfaseCierre(desfase);
  }

  getDesfaseTexto(desfase: number): string {
    return textoDesfaseCierre(desfase, (n) => this.formatCurrency(n));
  }

  tieneDesfase(desfase: number): boolean {
    return tieneDesfaseCierre(desfase);
  }

  displayBase(): string {
    if (this.editingBase) {
      return this.editingBaseRaw;
    }
    if (this.cargandoBase) {
      return '';
    }
    return this.montoFormatter.format(this.baseSugerida);
  }

  onBaseFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingBase = true;
    this.editingBaseRaw =
      this.baseSugerida > 0 ? String(this.baseSugerida) : '';
    input.value = this.editingBaseRaw;
  }

  onBaseInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingBase = true;
    this.editingBaseRaw = input.value;
    this.baseSugerida = this.parsePesos(input.value);
  }

  onBaseBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.baseSugerida = this.parsePesos(input.value);
    this.editingBase = false;
    this.editingBaseRaw = '';
    input.value = this.montoFormatter.format(this.baseSugerida);
  }

  onCantidadCambio(fila: FilaBillete): void {
    if (!fila.rehidratada) {
      return;
    }
    const previa = this.conteosPrevios[fila.billete.valor] ?? 0;
    if (this.cantidadDe(fila) !== previa) {
      fila.rehidratada = false;
    }
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value).replace('COP', '$').trim();
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  asociar(): void {
    if (!this.hayConteo || this.guardando) {
      return;
    }
    const resultado = this.armarResultado();
    if (this.baseSugerida === this.baseOriginal) {
      this.dialogRef.close(resultado);
      return;
    }

    this.guardando = true;
    this.configurationService
      .actualizarPorKey(KEY_CORTE_VENTA_BASE_EFECTIVO, String(this.baseSugerida))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.guardando = false;
          this.dialogRef.close(resultado);
        },
        error: () => {
          this.guardando = false;
          this.snackBar.open(
            'No se pudo guardar la base sugerida en configuracion_app (corte-venta.base-efectivo).',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  private aplicarConteosPrevios(): void {
    for (const fila of this.filas) {
      const previa = this.conteosPrevios[fila.billete.valor] ?? 0;
      if (previa > 0) {
        fila.cantidadCtrl.setValue(previa, { emitEvent: false });
        fila.rehidratada = true;
      }
    }
  }

  private armarResultado(): AsistenteCierreCajaResultado {
    const conteos: ConteoBilletes = {};
    for (const fila of this.filas) {
      const cantidad = this.cantidadDe(fila);
      if (cantidad > 0) {
        conteos[fila.billete.valor] = cantidad;
      }
    }
    return {
      contado: this.contado,
      totalBilletes: this.totalBilletes,
      baseSugerida: this.baseSugerida,
      conteos
    };
  }

  private parsePesos(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }
    const digits = String(value).replace(/[^\d]/g, '');
    if (!digits) {
      return 0;
    }
    const n = Number(digits);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
}
