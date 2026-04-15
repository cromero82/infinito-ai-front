import { Component, ElementRef, Inject, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface PagoEfectivoCambioData {
  total: number;
  /** Si se proporciona, el modal ejecuta el pago al confirmar y muestra estado éxito/error. */
  ejecutarPago?: (montoRecibido: number) => Observable<number>;
  /** Se llama tras éxito si "imprimir recibo al pagar" está activo. Usado en el botón Imprimir recibo. */
  imprimirRecibo?: () => void;
  /** Se llama al cerrar tras éxito (para snackbar). */
  mostrarSnackbarExito?: (totalGuardado: number) => void;
  /** Antes de snackbar / impresión: guarda monto recibido y cambio en el componente padre para la tirilla. */
  registrarDatosImpresion?: (d: { montoRecibido: number; cambio: number }) => void;
}

export interface PagoEfectivoCambioResultado {
  pagaCon: number;
  cambio: number;
}

type EstadoModal = 'entrada' | 'procesando' | 'exito' | 'error';

interface BilleteOption {
  label: string;
  valor: number;
  imagen: string;
}

@Component({
  selector: 'vex-pago-efectivo-cambio',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './pago-efectivo-cambio.component.html',
  styleUrls: ['./pago-efectivo-cambio.component.scss']
})
export class PagoEfectivoCambioComponent implements OnInit, AfterViewInit {
  @ViewChild('pagaConInput') pagaConInputRef?: ElementRef<HTMLInputElement>;
  readonly pagaConCtrl = new FormControl<string>('');
  pagoInsuficiente = false;
  private cambioNegativo = 0;

  estado: EstadoModal = 'entrada';
  errorMsg = '';
  totalGuardado = 0;
  pagaConResultado = 0;
  cambioResultado = 0;
  readonly billetes: BilleteOption[] = [
    { label: '$ 100.000', valor: 100000, imagen: 'assets/img/cash/billete-100mil-medium.png' },
    { label: '$ 50.000', valor: 50000, imagen: 'assets/img/cash/billete-50mil-medium.png' },
    { label: '$ 20.000', valor: 20000, imagen: 'assets/img/cash/billete-20-mil-medium.png' },
    { label: '$ 10.000', valor: 10000, imagen: 'assets/img/cash/billete-10-mil-medium.png' },
        { label: '$ 5.000', valor: 5000, imagen: 'assets/img/cash/billete-5-mil-medium.png' }
  ];

  cambio = 0;
  readonly total: number;
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  /**
   * Cuántas "unidades" de cada denominación forman el monto (sumar ↑ / restar ↓ en billetes).
   * Varios valores > 0 ⇒ varios billetes con estilo seleccionado a la vez.
   */
  private conteosPorDenominacion: Record<number, number> = {};

  /**
   * Tras elegir un billete al menos una vez, cada billete se divide en dos zonas:
   * mitad superior suma esa denominación a "Paga con"; mitad inferior la resta.
   */
  modoSumaRestaBilletes = false;

  readonly data: PagoEfectivoCambioData;

  constructor(
    private readonly dialogRef: MatDialogRef<PagoEfectivoCambioComponent, PagoEfectivoCambioResultado | null>,
    @Inject(MAT_DIALOG_DATA) data: PagoEfectivoCambioData,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.data = data;
    this.total = data.total ?? 0;
    this.conteosPorDenominacion = this.descomponerGreedy(this.total);
    const formattedTotal = this.formatCurrency(this.total);
    this.pagaConCtrl.setValue(formattedTotal);
  }

  ngOnInit(): void {
    this.pagaConCtrl.valueChanges.subscribe((valor) => {
      const pagaCon = this.parseCurrency(valor);
      const diferencia = pagaCon - this.total;
      this.cambio = Math.max(0, diferencia);
      this.pagoInsuficiente = diferencia < 0;
      this.cambioNegativo = diferencia < 0 ? Math.abs(diferencia) : 0;
      const sumaConteos = this.sumaConteos();
      if (pagaCon !== sumaConteos) {
        this.conteosPorDenominacion = this.descomponerGreedy(pagaCon);
      }
      if (pagaCon === 0) {
        this.modoSumaRestaBilletes = false;
      }
    });
  }

  ngAfterViewInit(): void {
    const inputEl = this.pagaConInputRef?.nativeElement;
    if (!inputEl) {
      return;
    }
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });
  }

  seleccionarBillete(valor: number): void {
    this.modoSumaRestaBilletes = true;
    this.conteosPorDenominacion = { [valor]: 1 };
    this.pagaConCtrl.setValue(this.formatCurrency(valor));
    const inputEl = this.pagaConInputRef?.nativeElement;
    if (!inputEl) {
      return;
    }
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });
  }

  onBilleteButtonClick(event: MouseEvent, valor: number): void {
    if (this.modoSumaRestaBilletes) {
      return;
    }
    event.preventDefault();
    this.seleccionarBillete(valor);
  }

  onZonaSumarBillete(event: Event, valor: number): void {
    event.preventDefault();
    event.stopPropagation();
    const actual = this.parseCurrency(this.pagaConCtrl.value);
    this.ajustarConteo(valor, +1);
    this.pagaConCtrl.setValue(this.formatCurrency(actual + valor));
    this.enfocarPagaCon();
  }

  onZonaRestarBillete(event: Event, valor: number): void {
    event.preventDefault();
    event.stopPropagation();
    const actual = this.parseCurrency(this.pagaConCtrl.value);
    const nuevo = Math.max(0, actual - valor);
    if ((this.conteosPorDenominacion[valor] ?? 0) > 0) {
      this.ajustarConteo(valor, -1);
    } else {
      this.conteosPorDenominacion = this.descomponerGreedy(nuevo);
    }
    this.pagaConCtrl.setValue(this.formatCurrency(nuevo));
    this.enfocarPagaCon();
  }

  private sumaConteos(): number {
    return Object.entries(this.conteosPorDenominacion).reduce(
      (acc, [denom, n]) => acc + Number(denom) * n,
      0
    );
  }

  private ajustarConteo(valor: number, delta: number): void {
    const siguiente = (this.conteosPorDenominacion[valor] ?? 0) + delta;
    if (siguiente <= 0) {
      delete this.conteosPorDenominacion[valor];
    } else {
      this.conteosPorDenominacion[valor] = siguiente;
    }
  }

  /**
   * Descomposición voraz (mayor denominación primero). Si el monto no se agota sin resto, no hay selección.
   */
  private descomponerGreedy(monto: number): Record<number, number> {
    if (monto <= 0) {
      return {};
    }
    let resto = monto;
    const out: Record<number, number> = {};
    for (const b of this.billetes) {
      const n = Math.floor(resto / b.valor);
      if (n > 0) {
        out[b.valor] = n;
        resto -= n * b.valor;
      }
    }
    return resto === 0 ? out : {};
  }

  private enfocarPagaCon(): void {
    const inputEl = this.pagaConInputRef?.nativeElement;
    if (!inputEl) {
      return;
    }
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });
  }

  onPagaConKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== 'NumpadEnter') {
      return;
    }

    if (this.pagoInsuficiente || !this.pagaConCtrl.value) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.confirmar();
  }

  confirmar(): void {
    const pagaCon = this.parseCurrency(this.pagaConCtrl.value);
    if (Number.isNaN(pagaCon) || pagaCon <= 0 || this.pagoInsuficiente) {
      return;
    }

    const cambio = Math.max(0, pagaCon - this.total);
    this.pagaConResultado = pagaCon;
    this.cambioResultado = cambio;
    this.data.registrarDatosImpresion?.({ montoRecibido: this.pagaConResultado, cambio: this.cambioResultado });

    if (this.data.ejecutarPago) {
      this.estado = 'procesando';
      this.cdr.markForCheck();
      
      // Verificar si debe imprimir automáticamente después del pago
      const debeImprimir = localStorage.getItem('imprimir-recibo') === 'true';
      
      this.data
        .ejecutarPago!(pagaCon)
        .pipe(finalize(() => this.cdr.markForCheck()))
        .subscribe({
          next: (tg) => {
            this.totalGuardado = tg;

            // Snackbar/cache antes de imprimir: imprimirRecibo vacía detallesParaImprimir y el historial
            // de reimpresión necesita esos detalles en cacheRecentReciboForReprint.
            this.data.mostrarSnackbarExito?.(tg);

            if (debeImprimir && this.data.imprimirRecibo) {
              console.log('Pago exitoso, imprimiendo automáticamente...');
              try {
                this.data.imprimirRecibo();
              } catch (e) {
                console.error('Error al imprimir recibo', e);
              }
            }
            this.dialogRef.close({
              pagaCon: this.pagaConResultado,
              cambio: this.cambioResultado
            });
          },
          error: (err) => {
            this.errorMsg = err?.message ?? 'Error al registrar el pago.';
            this.estado = 'error';
            this.cdr.markForCheck();
          }
        });
    } else {
      this.dialogRef.close({ pagaCon, cambio });
    }
  }

  onImprimirRecibo(): void {
    this.data.registrarDatosImpresion?.({ montoRecibido: this.pagaConResultado, cambio: this.cambioResultado });
    this.data.mostrarSnackbarExito?.(this.totalGuardado);
    try {
      this.data.imprimirRecibo?.();
    } catch (e) {
      console.error('Error al imprimir recibo', e);
    }
    this.dialogRef.close({
      pagaCon: this.pagaConResultado,
      cambio: this.cambioResultado
    });
  }

  onCerrarExito(): void {
    console.log('=== CERRAR EXITO LLAMADO ===');
    console.log('localStorage imprimir-recibo:', localStorage.getItem('imprimir-recibo'));
    
    // Verificar localStorage antes de cerrar
    const debeImprimir = localStorage.getItem('imprimir-recibo') === 'true';
    console.log('debeImprimir:', debeImprimir);
    
    // Cerrar el modal primero
    this.data.registrarDatosImpresion?.({ montoRecibido: this.pagaConResultado, cambio: this.cambioResultado });
    this.data.mostrarSnackbarExito?.(this.totalGuardado);
    this.dialogRef.close({
      pagaCon: this.pagaConResultado,
      cambio: this.cambioResultado
    });

    // Si debe imprimir, hacerlo después de cerrar el modal
    if (debeImprimir) {
      console.log('Programando impresión en 300ms...');
      setTimeout(() => {
        console.log('Ejecutando impresión ahora...');
        try {
          this.data.imprimirRecibo?.();
        } catch (e) {
          console.error('Error al imprimir recibo', e);
        }
      }, 300);
    } else {
      console.log('No se imprimirá porque imprimir-recibo no está en true');
    }
  }

  onReintentar(): void {
    this.estado = 'entrada';
    this.errorMsg = '';
    this.cdr.markForCheck();
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  formatCurrency(value: number | null | undefined): string {
    const numericValue = Number(value ?? 0);
    const formatted = this.currencyFormatter.format(numericValue);
    return formatted.replace('COP', '$').trim();
  }

  esBilleteSeleccionado(valor: number): boolean {
    return (this.conteosPorDenominacion[valor] ?? 0) > 0;
  }

  private parseCurrency(value: string | null | undefined): number {
    const digits = String(value ?? '')
      .replace(/\s+/g, '')
      .replace(/[^\d]/g, '');
    if (!digits) {
      return 0;
    }
    return Number(digits);
  }

  get cambioParaMostrar(): number {
    return this.pagoInsuficiente ? -this.cambioNegativo : this.cambio;
  }
}


