import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteService, ClienteDto } from '../service/cliente.service';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { HistorialReciboService, QuickReciboRequest } from '../service/historial-recibo.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface QuickReciboData {
  sesionId: number;
}

@Component({
  selector: 'vex-quick-recibo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './quick-recibo.component.html',
  styleUrls: ['./quick-recibo.component.scss']
})
export class QuickReciboComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('totalInput') totalInputRef?: ElementRef<HTMLInputElement>;
  
  clienteCtrl = new FormControl<number | null>(null);
  totalCtrl = new FormControl<string>('');
  clientes: ClienteDto[] = [];
  metodosPago: MetodoPagoDto[] = [];
  selectedMetodoPagoId: number | null = null;
  loading = false;
  loadingClientes = false;
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
    private dialogRef: MatDialogRef<QuickReciboComponent>,
    private clienteService: ClienteService,
    private metodoPagoService: MetodoPagoService,
    private historialReciboService: HistorialReciboService,
    @Inject(MAT_DIALOG_DATA) public data: QuickReciboData
  ) {}

  ngOnInit(): void {
    this.loadClientes();
    this.loadMetodosPago();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.totalInputRef?.nativeElement.focus();
      this.totalInputRef?.nativeElement.select();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadClientes(): void {
    this.loadingClientes = true;
    this.clienteService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (clientes) => {
        this.clientes = clientes || [];
        // Select first client by default
        if (this.clientes.length > 0) {
          this.clienteCtrl.setValue(this.clientes[0].id);
        }
        this.loadingClientes = false;
      },
      error: (err) => {
        console.error('Error loading clientes', err);
        this.error = 'Error al cargar clientes.';
        this.loadingClientes = false;
      }
    });
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
  }

  onTotalKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && this.canPagar()) {
      keyboardEvent.preventDefault();
      this.pagar();
    }
  }

  canPagar(): boolean {
    return (
      this.clienteCtrl.value !== null &&
      this.selectedMetodoPagoId !== null &&
      this.totalCtrl.value !== '' &&
      this.parseCurrencyToNumber(this.totalCtrl.value ?? '') > 0 &&
      !this.loading
    );
  }

  pagar(): void {
    if (!this.canPagar()) {
      return;
    }

    const clienteId = this.clienteCtrl.value;
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

    this.loading = true;
    this.error = null;

    const payload: QuickReciboRequest = {
      clienteId,
      metodoPagoId,
      sesionId,
      total
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

  onTotalBlur(): void {
    const value = this.totalCtrl.value;
    if (value) {
      const numericValue = this.parseCurrencyToNumber(value);
      if (numericValue > 0) {
        this.totalCtrl.setValue(this.formatCurrency(numericValue), { emitEvent: false });
      }
    }
  }
}

