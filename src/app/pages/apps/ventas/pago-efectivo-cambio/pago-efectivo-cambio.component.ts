import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  MetodoPagoService,
  MetodoPagoDto
} from '../service/metodo-pago.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize, take } from 'rxjs/operators';
import {
  IMPRIMIR_RECIBO_KEY,
  IMPRIMIR_TICKET_LUEGO_DE_PAGAR_LABEL
} from '../imprimir-recibo-preference.constants';

/** Opciones al invocar la impresión desde el modal de efectivo (no persiste preferencia global). */
export interface ImprimirReciboTrasPagoOpciones {
  /**
   * Si true, imprime aunque `IMPRIMIR_RECIBO_KEY` sea false (solo este recibo o clic explícito en el modal).
   */
  omitirPreferenciaGlobal?: boolean;
}

export interface PagoEfectivoCambioData {
  total: number;
  /** Si se proporciona, el modal ejecuta el pago al confirmar y muestra estado éxito/error. */
  ejecutarPago?: (montoRecibido: number) => Observable<number>;
  /** Imprime el recibo; el modal puede pedir omitir la preferencia global solo para esta impresión. */
  imprimirRecibo?: (opciones?: ImprimirReciboTrasPagoOpciones) => void;
  /** Se llama al cerrar tras éxito (para snackbar). */
  mostrarSnackbarExito?: (totalGuardado: number) => void;
  /** Antes de snackbar / impresión: guarda monto recibido y cambio en el componente padre para la tirilla. */
  registrarDatosImpresion?: (d: {
    montoRecibido: number;
    cambio: number;
  }) => void;
}

/** `pagaCon` es el total abonado (efectivo + otros métodos en modo mixto). */
export interface PagoEfectivoCambioResultado {
  pagaCon: number;
  cambio: number;
}

type EstadoModal = 'entrada' | 'procesando' | 'exito' | 'error';

type ModoPagoEfectivo = 'solo-efectivo' | 'mixto';

/** Clase en el overlay pane: estilos en `styles.scss` (padding MDC, alto según contenido). */
const PAGO_EFECTIVO_DIALOG_PANEL_CLASS = 'pago-efectivo-dialog-panel';

/** Al abrir el diálogo desde detalle-ticket se usa `width: '640px'`; en mixto se suma `PAGO_EFECTIVO_MIXTO_ANCHO_EXTRA_PX`. */
const PAGO_EFECTIVO_DIALOG_WIDTH_BASE_PX = 640;
const PAGO_EFECTIVO_MIXTO_ANCHO_EXTRA_PX = 20;

/** Al pasar a modo mixto, el `top` del overlay es la posición inicial menos este valor (px). */
const PAGO_EFECTIVO_MIXTO_TOP_OFFSET_PX = 70;

interface BilleteOption {
  label: string;
  valor: number;
  imagen: string;
}

@Component({
  selector: 'vex-pago-efectivo-cambio',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatTooltipModule,
    ReactiveFormsModule,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './pago-efectivo-cambio.component.html',
  styleUrls: ['./pago-efectivo-cambio.component.scss']
})
export class PagoEfectivoCambioComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('pagaConInput') pagaConInputRef?: ElementRef<HTMLInputElement>;
  readonly pagaConCtrl = new FormControl<string>('');
  readonly modoPagoCtrl = new FormControl<ModoPagoEfectivo>('solo-efectivo', {
    nonNullable: true
  });
  /** Métodos distintos de efectivo (id 1), mismo criterio que `metodos-pago` (no inactivos). */
  metodosOtros: MetodoPagoDto[] = [];
  readonly montosMixtosPorId: Record<number, string> = {};
  private readonly destroy$ = new Subject<void>();

  pagoInsuficiente = false;
  private cambioNegativo = 0;

  estado: EstadoModal = 'entrada';
  errorMsg = '';
  totalGuardado = 0;
  pagaConResultado = 0;
  cambioResultado = 0;
  readonly billetes: BilleteOption[] = [
    {
      label: '$ 100.000',
      valor: 100000,
      imagen: 'assets/img/cash/billete-100mil-medium.png'
    },
    {
      label: '$ 50.000',
      valor: 50000,
      imagen: 'assets/img/cash/billete-50mil-medium.png'
    },
    {
      label: '$ 20.000',
      valor: 20000,
      imagen: 'assets/img/cash/billete-20-mil-medium.png'
    },
    {
      label: '$ 10.000',
      valor: 10000,
      imagen: 'assets/img/cash/billete-10-mil-medium.png'
    },
    {
      label: '$ 5.000',
      valor: 5000,
      imagen: 'assets/img/cash/billete-5-mil-medium.png'
    },
    {
      label: '$ 2.000',
      valor: 2000,
      imagen: 'assets/img/cash/billete-2-mil-small.png'
    }
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
  /**
   * Preferencia global (`IMPRIMIR_RECIBO_KEY`), solo lectura en este modal.
   * Si es false, el checkbox va deshabilitado y no se imprime tras pagar.
   */
  readonly preferenciaGlobalImprimirRecibo: boolean;
  /**
   * Solo para este pago/cierre del modal: no persiste en localStorage.
   * Si la global es false, permanece false. Si es true, inicia en true y el usuario puede desmarcar.
   */
  imprimirSoloEsteRecibo = false;
  readonly imprimirTicketLuegoDePagarLabel = IMPRIMIR_TICKET_LUEGO_DE_PAGAR_LABEL;

  /** `top` del overlay (viewport) al abrir en solo efectivo; en mixto se usa `top − 40px`. */
  private overlayTopPxInicial: number | null = null;

  constructor(
    private readonly dialogRef: MatDialogRef<
      PagoEfectivoCambioComponent,
      PagoEfectivoCambioResultado | null
    >,
    @Inject(MAT_DIALOG_DATA) data: PagoEfectivoCambioData,
    private readonly cdr: ChangeDetectorRef,
    private readonly metodoPagoService: MetodoPagoService
  ) {
    this.data = data;
    this.preferenciaGlobalImprimirRecibo =
      localStorage.getItem(IMPRIMIR_RECIBO_KEY) === 'true';
    this.imprimirSoloEsteRecibo = this.preferenciaGlobalImprimirRecibo;
    this.total = data.total ?? 0;
    this.conteosPorDenominacion = this.descomponerGreedy(this.total);
    const formattedTotal = this.formatCurrency(this.total);
    this.pagaConCtrl.setValue(formattedTotal);
  }

  ngOnInit(): void {
    this.dialogRef.addPanelClass(PAGO_EFECTIVO_DIALOG_PANEL_CLASS);

    this.dialogRef
      .afterOpened()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => {
        const intentarCaptura = (): void => {
          setTimeout(() => {
            requestAnimationFrame(() => this.capturarPosicionVerticalInicialOverlay());
          }, 0);
        };
        intentarCaptura();
        setTimeout(intentarCaptura, 50);
      });

    this.metodoPagoService
      .obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) => {
          const sorted = (metodos ?? [])
            .filter((m) => m.id !== 1 && m.estado !== 'inactivo')
            .sort((a, b) => a.id - b.id);
          this.metodosOtros = sorted;
          for (const m of sorted) {
            if (this.montosMixtosPorId[m.id] === undefined) {
              this.montosMixtosPorId[m.id] = '0';
            }
          }
          this.cdr.markForCheck();
          if (this.modoPagoCtrl.value === 'mixto') {
            this.aplicarAnchoDialogSegunModo();
            this.restaurarPosicionVerticalInicial();
          }
        },
        error: (err) => console.error('Error cargando métodos de pago', err)
      });

    this.pagaConCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.aplicarTotales());

    this.modoPagoCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((modo) => {
        if (modo === 'solo-efectivo') {
          for (const m of this.metodosOtros) {
            this.montosMixtosPorId[m.id] = '0';
          }
        }
        this.aplicarTotales();
        this.aplicarAnchoDialogSegunModo();
        if (modo === 'mixto') {
          this.restaurarPosicionVerticalInicial();
        }
      });

    this.aplicarTotales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Ancho del overlay: base (coincide con `open` en detalle-ticket) o base + 100px en modo mixto.
   */
  private aplicarAnchoDialogSegunModo(): void {
    const w =
      this.modoPagoCtrl.value === 'mixto'
        ? PAGO_EFECTIVO_DIALOG_WIDTH_BASE_PX + PAGO_EFECTIVO_MIXTO_ANCHO_EXTRA_PX
        : PAGO_EFECTIVO_DIALOG_WIDTH_BASE_PX;
    try {
      this.dialogRef.updateSize(`${w}px`);
    } catch {
      /* noop */
    }
  }

  /**
   * Guarda el `top` del panel (coordenadas de viewport) la primera vez, con el layout inicial.
   */
  private capturarPosicionVerticalInicialOverlay(): void {
    if (this.overlayTopPxInicial !== null) {
      return;
    }
    if (this.modoPagoCtrl.value !== 'solo-efectivo') {
      return;
    }
    const pane = document.querySelector(
      `.cdk-overlay-pane.${PAGO_EFECTIVO_DIALOG_PANEL_CLASS}`
    ) as HTMLElement | null;
    if (!pane) {
      return;
    }
    this.overlayTopPxInicial = Math.round(pane.getBoundingClientRect().top);
  }

  /**
   * Tras pasar a mixto el panel crece; reaplica `top` = posición inicial al abrir menos
   * `PAGO_EFECTIVO_MIXTO_TOP_OFFSET_PX`.
   */
  private restaurarPosicionVerticalInicial(): void {
    if (this.overlayTopPxInicial === null) {
      return;
    }
    const topPx = Math.max(
      0,
      this.overlayTopPxInicial - PAGO_EFECTIVO_MIXTO_TOP_OFFSET_PX
    );
    const aplicar = (): void => {
      try {
        this.dialogRef.updatePosition({ top: `${topPx}px` });
      } catch {
        /* noop */
      }
    };
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          aplicar();
          setTimeout(aplicar, 64);
        });
      });
    }, 0);
  }

  get montoEfectivoPagaCon(): number {
    return this.parseCurrency(this.pagaConCtrl.value);
  }

  get montoOtrosMediosPagaCon(): number {
    return this.modoPagoCtrl.value === 'mixto' ? this.sumaMontosMixtos() : 0;
  }

  private sumaMontosMixtos(): number {
    let sumaOtros = 0;
    for (const m of this.metodosOtros) {
      sumaOtros += this.parseCurrency(this.montosMixtosPorId[m.id]);
    }
    return sumaOtros;
  }

  /** Total abonado: efectivo ("Paga con") + suma de montos en modo mixto. */
  calcularTotalPagado(): number {
    const efectivo = this.montoEfectivoPagaCon;
    if (this.modoPagoCtrl.value !== 'mixto') {
      return efectivo;
    }
    return efectivo + this.sumaMontosMixtos();
  }

  get confirmarDeshabilitado(): boolean {
    const tp = this.calcularTotalPagado();
    return tp <= 0 || this.pagoInsuficiente;
  }

  onMontoMixtoInput(id: number, raw: string): void {
    const digits = String(raw ?? '')
      .replace(/\s+/g, '')
      .replace(/[^\d]/g, '');
    this.montosMixtosPorId[id] = digits === '' ? '0' : digits;
    this.aplicarTotales();
  }

  private aplicarTotales(): void {
    const totalPagado = this.calcularTotalPagado();
    const diferencia = totalPagado - this.total;
    this.cambio = Math.max(0, diferencia);
    this.pagoInsuficiente = diferencia < 0;
    this.cambioNegativo = diferencia < 0 ? Math.abs(diferencia) : 0;

    const pagaCon = this.parseCurrency(this.pagaConCtrl.value);
    const sumaConteos = this.sumaConteos();
    if (pagaCon !== sumaConteos) {
      this.conteosPorDenominacion = this.descomponerGreedy(pagaCon);
    }
    if (pagaCon === 0) {
      this.modoSumaRestaBilletes = false;
    }
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.capturarPosicionVerticalInicialOverlay();
    }, 0);

    const inputEl = this.pagaConInputRef?.nativeElement;
    if (!inputEl) {
      return;
    }
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });
  }

  /** Solo afecta a este pago; no escribe `IMPRIMIR_RECIBO_KEY` en localStorage. */
  onImprimirSoloEsteReciboChange(checked: boolean): void {
    this.imprimirSoloEsteRecibo = checked;
    this.cdr.markForCheck();
  }

  /**
   * Tras pagar con el checkbox marcado: si la global es false, hay que saltar la comprobación
   * de localStorage en el padre para imprimir solo este ticket.
   */
  private opcionesImpresionTrasPago(): ImprimirReciboTrasPagoOpciones | undefined {
    if (!this.imprimirSoloEsteRecibo) {
      return undefined;
    }
    if (!this.preferenciaGlobalImprimirRecibo) {
      return { omitirPreferenciaGlobal: true };
    }
    return undefined;
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

    if (this.confirmarDeshabilitado) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.confirmar();
  }

  confirmar(): void {
    const totalPagado = this.calcularTotalPagado();
    if (Number.isNaN(totalPagado) || totalPagado <= 0 || this.pagoInsuficiente) {
      return;
    }

    const cambio = Math.max(0, totalPagado - this.total);
    this.pagaConResultado = totalPagado;
    this.cambioResultado = cambio;
    this.data.registrarDatosImpresion?.({
      montoRecibido: this.pagaConResultado,
      cambio: this.cambioResultado
    });

    if (this.data.ejecutarPago) {
      this.estado = 'procesando';
      this.cdr.markForCheck();

      const debeImprimir =
        this.imprimirSoloEsteRecibo && !!this.data.imprimirRecibo;

      this.data.ejecutarPago!(totalPagado)
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
                this.data.imprimirRecibo(this.opcionesImpresionTrasPago());
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
      this.dialogRef.close({ pagaCon: totalPagado, cambio });
    }
  }

  onImprimirRecibo(): void {
    this.data.registrarDatosImpresion?.({
      montoRecibido: this.pagaConResultado,
      cambio: this.cambioResultado
    });
    this.data.mostrarSnackbarExito?.(this.totalGuardado);
    try {
      this.data.imprimirRecibo?.({ omitirPreferenciaGlobal: true });
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
    console.log(
      'localStorage imprimir recibo:',
      localStorage.getItem(IMPRIMIR_RECIBO_KEY)
    );

    const debeImprimir =
      this.imprimirSoloEsteRecibo && !!this.data.imprimirRecibo;
    console.log('debeImprimir:', debeImprimir);

    // Cerrar el modal primero
    this.data.registrarDatosImpresion?.({
      montoRecibido: this.pagaConResultado,
      cambio: this.cambioResultado
    });
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
          this.data.imprimirRecibo?.(this.opcionesImpresionTrasPago());
        } catch (e) {
          console.error('Error al imprimir recibo', e);
        }
      }, 300);
    } else {
      console.log(
        'No se imprimirá porque la preferencia de imprimir tras pagar está desactivada'
      );
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
