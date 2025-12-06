import { Component, ElementRef, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface PagoEfectivoCambioData {
  total: number;
}

export interface PagoEfectivoCambioResultado {
  pagaCon: number;
  cambio: number;
}

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
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './pago-efectivo-cambio.component.html',
  styleUrls: ['./pago-efectivo-cambio.component.scss']
})
export class PagoEfectivoCambioComponent implements OnInit, AfterViewInit {
  @ViewChild('pagaConInput') pagaConInputRef?: ElementRef<HTMLInputElement>;
  readonly pagaConCtrl = new FormControl<string>('');
  pagoInsuficiente = false;
  private cambioNegativo = 0;
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
  private selectedBilleteValor: number | null = null;

  constructor(
    private readonly dialogRef: MatDialogRef<PagoEfectivoCambioComponent, PagoEfectivoCambioResultado | null>,
    @Inject(MAT_DIALOG_DATA) data: PagoEfectivoCambioData
  ) {
    this.total = data.total ?? 0;
    const formattedTotal = this.formatCurrency(this.total);
    this.pagaConCtrl.setValue(formattedTotal);
    this.selectedBilleteValor = this.billetes.some((b) => b.valor === this.total) ? this.total : null;
  }

  ngOnInit(): void {
    this.pagaConCtrl.valueChanges.subscribe((valor) => {
      const pagaCon = this.parseCurrency(valor);
      const diferencia = pagaCon - this.total;
      this.cambio = Math.max(0, diferencia);
      this.pagoInsuficiente = diferencia < 0;
      this.cambioNegativo = diferencia < 0 ? Math.abs(diferencia) : 0;
      const coincide = this.billetes.some((billete) => billete.valor === pagaCon);
      this.selectedBilleteValor = coincide ? pagaCon : null;
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
    this.selectedBilleteValor = valor;
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
    this.dialogRef.close({
      pagaCon,
      cambio
    });
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
    return this.selectedBilleteValor === valor;
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


