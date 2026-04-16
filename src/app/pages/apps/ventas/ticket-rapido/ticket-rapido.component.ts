import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteDto } from '../service/cliente.service';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { HistorialReciboService, QuickReciboRequest } from '../service/historial-recibo.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClienteSelectorComponent } from '../cliente-selector/cliente-selector.component';

export interface TicketRapidoData {
  sesionId: number;
}

@Component({
    selector: 'ticket-rapido',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatTooltipModule,
        MatIconModule,
        MatProgressSpinnerModule,
        ClienteSelectorComponent
    ],
    templateUrl: './ticket-rapido.component.html',
    styleUrls: ['./ticket-rapido.component.scss']
})
export class TicketRapidoComponent implements OnInit, OnDestroy {
  @ViewChild('totalInput') totalInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('pagaConInput') pagaConInputRef?: ElementRef<HTMLInputElement>;

  totalCtrl = new FormControl<string>('');
  pagaConCtrl = new FormControl<string>('');
  cambio = 0;
  pagoInsuficiente = false;
  totalTieneFocus = false;
  selectedClienteId: number | null = null;
  metodosPago: MetodoPagoDto[] = [];
  selectedMetodoPagoId: number | null = null;
  loading = false;
  loadingMetodos = false;
  error: string | null = null;

  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<TicketRapidoComponent>,
    private metodoPagoService: MetodoPagoService,
    private historialReciboService: HistorialReciboService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: TicketRapidoData
  ) {}

  ngOnInit(): void {
    this.loadMetodosPago();

    // Configurar el cálculo del cambio cuando cambia "Paga con"
    this.pagaConCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calcularCambio();
    });

    // También recalcular cuando cambia el total (si es efectivo)
    this.totalCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.selectedMetodoPagoId === 1) {
        const totalValue = this.parseCurrencyToNumber(this.totalCtrl.value || '');
        const pagaConValue = this.parseCurrencyToNumber(this.pagaConCtrl.value || '');

        if (totalValue > 0) {
          if (pagaConValue === 0 || pagaConValue === this.parseCurrencyToNumber(this.totalCtrl.value || '')) {
            this.pagaConCtrl.setValue(this.formatCurrency(totalValue), { emitEvent: false });
          }
        }
        this.calcularCambio();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Llamado cuando el ClienteSelectorComponent emite un cliente seleccionado o creado. */
  onClienteSelectedFromSelector(cliente: ClienteDto | null): void {
    this.selectedClienteId = cliente?.id ?? null;
    if (cliente) {
      // Mover focus al campo total
      setTimeout(() => {
        const totalInput = this.totalInputRef?.nativeElement;
        if (totalInput) {
          totalInput.focus();
          totalInput.select();
        }
      }, 100);
    }
  }

  private loadMetodosPago(): void {
    this.loadingMetodos = true;
    this.metodoPagoService.obtenerMetodosPago().pipe(takeUntil(this.destroy$)).subscribe({
      next: (metodos) => {
        this.metodosPago = (metodos ?? []).slice().sort((a, b) => a.id - b.id);
        this.loadingMetodos = false;
      },
      error: (err) => {
        console.error('Error loading métodos de pago', err);
        this.loadingMetodos = false;
      }
    });
  }

  seleccionarMetodoPago(metodo: MetodoPagoDto): void {
    if (metodo.estado === 'inactivo') {
      return;
    }
    this.selectedMetodoPagoId = metodo.id;
    
    // Si se selecciona efectivo (id: 1), inicializar "Paga con" con el valor del total
    if (metodo.id === 1) {
      const totalValue = this.parseCurrencyToNumber(this.totalCtrl.value || '');
      if (totalValue > 0) {
        this.pagaConCtrl.setValue(this.formatCurrency(totalValue), { emitEvent: false });
        this.calcularCambio();
        
        // Forzar detección de cambios para que el campo se muestre
        this.cdr.detectChanges();
        
        // Enfocar el campo "Paga con" y seleccionar todo el texto
        // Usar requestAnimationFrame para asegurar que el DOM esté listo
        requestAnimationFrame(() => {
          setTimeout(() => {
            const pagaConInput = this.pagaConInputRef?.nativeElement;
            if (pagaConInput) {
              pagaConInput.focus();
              pagaConInput.select();
            }
          }, 50);
        });
      }
    } else {
      // Si se selecciona otro método, limpiar los campos de efectivo
      this.pagaConCtrl.setValue('', { emitEvent: false });
      this.cambio = 0;
      this.pagoInsuficiente = false;
    }
  }

  calcularCambio(): void {
    const total = this.parseCurrencyToNumber(this.totalCtrl.value || '');
    const pagaCon = this.parseCurrencyToNumber(this.pagaConCtrl.value || '');
    const diferencia = pagaCon - total;
    this.cambio = Math.max(0, diferencia);
    this.pagoInsuficiente = diferencia < 0;
  }

  onPagaConInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Permitir solo números
    const cleaned = value.replace(/[^\d]/g, '');
    
    if (cleaned === '') {
      this.pagaConCtrl.setValue('', { emitEvent: false });
      this.calcularCambio();
      return;
    }
    
    // Guardar el valor numérico sin formato para permitir edición fluida
    this.pagaConCtrl.setValue(cleaned, { emitEvent: false });
    this.calcularCambio();
  }

  onPagaConBlur(): void {
    const value = this.pagaConCtrl.value;
    if (value) {
      const numericValue = this.parseCurrencyToNumber(value);
      if (numericValue > 0) {
        this.pagaConCtrl.setValue(this.formatCurrency(numericValue), { emitEvent: false });
        this.calcularCambio();
      } else {
        // Si el valor es 0 o inválido, establecer el total como valor por defecto
        const totalValue = this.parseCurrencyToNumber(this.totalCtrl.value || '');
        if (totalValue > 0) {
          this.pagaConCtrl.setValue(this.formatCurrency(totalValue), { emitEvent: false });
          this.calcularCambio();
        }
      }
    } else {
      // Si está vacío, establecer el total como valor por defecto
      const totalValue = this.parseCurrencyToNumber(this.totalCtrl.value || '');
      if (totalValue > 0) {
        this.pagaConCtrl.setValue(this.formatCurrency(totalValue), { emitEvent: false });
        this.calcularCambio();
      }
    }
  }

  getCambioFormateado(): string {
    if (this.cambio > 0) {
      return this.formatCurrency(this.cambio);
    }
    return '';
  }

  getFaltaFormateado(): string {
    const total = this.parseCurrencyToNumber(this.totalCtrl.value || '');
    const pagaCon = this.parseCurrencyToNumber(this.pagaConCtrl.value || '');
    const falta = Math.abs(total - pagaCon);
    return this.formatCurrency(falta);
  }

  limpiarPagaCon(): void {
    this.pagaConCtrl.setValue('', { emitEvent: false });
    this.cambio = 0;
    this.pagoInsuficiente = false;
    // Enfocar el campo después de limpiar
    setTimeout(() => {
      const pagaConInput = this.pagaConInputRef?.nativeElement;
      if (pagaConInput) {
        pagaConInput.focus();
      }
    }, 50);
  }

  onTotalKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && this.canPagar()) {
      keyboardEvent.preventDefault();
      this.pagar();
    }
  }

  canPagar(): boolean {
    const tieneCliente = this.selectedClienteId !== null;
    const tieneMetodoPago = this.selectedMetodoPagoId !== null;
    const tieneTotal = this.totalCtrl.value !== '' && this.parseCurrencyToNumber(this.totalCtrl.value ?? '') > 0;
    const noEstaCargando = !this.loading;

    // Si es efectivo (id: 1), validar que el pago sea suficiente
    if (this.selectedMetodoPagoId === 1) {
      const pagaCon = this.parseCurrencyToNumber(this.pagaConCtrl.value || '');
      const total = this.parseCurrencyToNumber(this.totalCtrl.value || '');
      const pagoSuficiente = pagaCon >= total && pagaCon > 0;
      return tieneCliente && tieneMetodoPago && tieneTotal && pagoSuficiente && noEstaCargando;
    }

    return tieneCliente && tieneMetodoPago && tieneTotal && noEstaCargando;
  }

  getTotalFormateado(): string {
    const value = this.totalCtrl.value;
    if (!value) {
      return '';
    }
    const numericValue = this.parseCurrencyToNumber(value);
    if (numericValue > 0) {
      return this.formatCurrency(numericValue);
    }
    return '';
  }

  pagar(): void {
    if (!this.canPagar()) {
      return;
    }

    const clienteId = this.selectedClienteId;
    const metodoPagoId = this.selectedMetodoPagoId;
    // Get the raw value and parse it directly as a number
    const rawValue = this.totalCtrl.value ?? '';
    // Remove all non-numeric characters
    const cleaned = rawValue.replace(/[^\d]/g, '');
    const total = Number(cleaned) || 0;
    const sesionId = this.data?.sesionId;

    if (!clienteId || !metodoPagoId || !sesionId) {
      this.error = 'Complete todos los campos requeridos.';
      return;
    }

    // Calcular montoRecibido según el método de pago
    let montoRecibido: number;
    if (metodoPagoId === 1) {
      // Si es efectivo (id: 1), usar el valor de "pagaCon"
      const pagaConRaw = this.pagaConCtrl.value ?? '';
      const pagaConCleaned = pagaConRaw.replace(/[^\d]/g, '');
      montoRecibido = Number(pagaConCleaned) || total;
    } else {
      // Para otros métodos de pago, montoRecibido es igual al total
      montoRecibido = total;
    }

    this.loading = true;
    this.error = null;

    const payload: QuickReciboRequest = {
      clienteId,
      metodoPagoId,
      sesionId,
      total,
      montoRecibido
    };

    this.historialReciboService.addQuickRecibo(payload).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error creating quick recibo', err);
        this.error = 'No se pudo registrar el recibo.';
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  formatCurrency(value: number | null | undefined): string {
    const numericValue = Number(value ?? 0);
    const formatted = this.currencyFormatter.format(numericValue);
    return formatted.replace('COP', '$').trim();
  }

  private parseCurrencyToNumber(value: string): number {
    if (!value) return 0;
    // Remove currency symbols, spaces, commas, and dots (thousand separators), then parse
    const cleaned = value.replace(/[$\s,.]/g, '');
    return Number(cleaned) || 0;
  }

  onTotalInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Remove all non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d]/g, '');
    
    if (cleaned === '') {
      this.totalCtrl.setValue('', { emitEvent: false });
      return;
    }
    
    // Parse as number
    const numericValue = Number(cleaned);
    if (!isNaN(numericValue) && numericValue >= 0) {
      // Store the raw numeric value, format only on blur
      this.totalCtrl.setValue(cleaned, { emitEvent: false });
    }
  }

  onTotalFocus(): void {
    this.totalTieneFocus = true;
  }

  onTotalBlur(): void {
    this.totalTieneFocus = false;
    const value = this.totalCtrl.value;
    if (value) {
      const numericValue = this.parseCurrencyToNumber(value);
      if (numericValue > 0) {
        this.totalCtrl.setValue(this.formatCurrency(numericValue), { emitEvent: false });
      }
    }
  }
}

