import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { ReciboDto } from '../service/recibo.service';
import { ReciboDetalleDto } from '../service/recibo-detalle.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'vex-metodos-pago',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './metodos-pago.component.html',
  styleUrls: ['./metodos-pago.component.scss']
})
export class MetodosPagoComponent implements OnInit, OnDestroy {
  @Input() recibo: ReciboDto | null = null;
  @Input() detalles: ReciboDetalleDto[] = [];
  @Input() disabled: boolean = false;
  @Input() valorReferencia: number | null = null; // Para usar diferencia en edición recibo
  @Input() permitirReSeleccionar: boolean = false; // Permitir seleccionar de nuevo el mismo método

  @Output() metodoPagoSeleccionado = new EventEmitter<MetodoPagoDto>();

  metodosPago: MetodoPagoDto[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private metodoPagoService: MetodoPagoService
  ) {}

  ngOnInit(): void {
    this.cargarMetodosPago();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarMetodosPago(): void {
    this.metodoPagoService
      .obtenerMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) =>
          (this.metodosPago = (metodos ?? []).slice().sort((a, b) => a.id - b.id)),
        error: (err) => console.error('Error cargando métodos de pago', err)
      });
  }

  seleccionarMetodoPago(metodo: MetodoPagoDto): void {
    if (!metodo || metodo.estado === 'inactivo' || this.disabled) {
      return;
    }

    if (this.recibo && this.recibo.metodoPagoId === metodo.id && !this.permitirReSeleccionar) {
      return;
    }

    this.metodoPagoSeleccionado.emit(metodo);
  }

  isMetodoSeleccionado(metodo: MetodoPagoDto): boolean {
    return this.recibo !== null && this.recibo.metodoPagoId === metodo.id;
  }
}

