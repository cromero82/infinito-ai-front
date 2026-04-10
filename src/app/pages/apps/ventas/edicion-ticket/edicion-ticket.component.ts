import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { EdicionReciboDetalleService, EdicionReciboDetalleDto } from '../service/edicion-recibo-detalle.service';
import { ReciboDetalleDto } from '../service/recibo-detalle.service';
import { ReciboDto } from '../service/recibo.service';
import { MetodoPagoDto } from '../service/metodo-pago.service';
import { MetodosPagoComponent } from '../metodos-pago/metodos-pago.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface CambioDetalle {
  tipo: 'agregado' | 'eliminado' | 'modificado';
  detalle: ReciboDetalleDto | EdicionReciboDetalleDto;
  cantidadAnterior?: number;
  cantidadNueva?: number;
  subtotalAnterior?: number;
  subtotalNuevo?: number;
  productoNombre?: string;
}

@Component({
  selector: 'edicion-ticket',
  standalone: true,
  imports: [CommonModule, MetodosPagoComponent, MatButtonModule],
  templateUrl: './edicion-ticket.component.html',
  styleUrls: ['./edicion-ticket.component.scss']
})
export class EdicionTicketComponent implements OnInit, OnChanges, OnDestroy {
  @Input() reciboId: number | null = null;
  @Input() detalles: ReciboDetalleDto[] = [];
  @Input() recibo: ReciboDto | null = null;

  @Output() metodoPagoSeleccionado = new EventEmitter<{ metodo: MetodoPagoDto; valorReferencia: number | null }>();
  @Output() finalizar = new EventEmitter<void>();

  edicionDetalles: EdicionReciboDetalleDto[] = [];
  cambios: CambioDetalle[] = [];
  loading = false;
  error: string | null = null;

  totalRecibo = 0;
  totalEdicionRecibo = 0;
  diferencia = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private edicionReciboDetalleService: EdicionReciboDetalleService
  ) {}

  ngOnInit(): void {
    if (this.reciboId) {
      this.loadEdicionDetalles();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('reciboId' in changes && this.reciboId) {
      this.loadEdicionDetalles();
    }
    if ('detalles' in changes) {
      this.analizarCambios();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEdicionDetalles(): void {
    if (!this.reciboId) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.edicionReciboDetalleService.getEdicionReciboDetalles(this.reciboId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detalles) => {
          this.edicionDetalles = detalles;
          this.loading = false;
          this.analizarCambios();
        },
        error: (err) => {
          console.error('Error loading edicion recibo detalles', err);
          this.error = 'Error al cargar los detalles de edición.';
          this.loading = false;
        }
      });
  }

  private analizarCambios(): void {
    if (!this.reciboId || this.edicionDetalles.length === 0) {
      this.cambios = [];
      this.calcularTotales();
      return;
    }

    const cambios: CambioDetalle[] = [];

    // Crear mapas para facilitar la búsqueda
    const edicionMap = new Map<number, EdicionReciboDetalleDto>();
    this.edicionDetalles.forEach(d => {
      edicionMap.set(d.productoId, d);
    });

    const detallesMap = new Map<number, ReciboDetalleDto>();
    this.detalles.forEach(d => {
      detallesMap.set(d.productoId, d);
    });

    // Buscar productos agregados (están en detalles actuales pero no en edición)
    this.detalles.forEach(detalle => {
      const edicionDetalle = edicionMap.get(detalle.productoId);
      if (!edicionDetalle) {
        cambios.push({
          tipo: 'agregado',
          detalle: detalle,
          cantidadNueva: detalle.cantidad,
          subtotalNuevo: detalle.subtotal,
          productoNombre: detalle.producto?.nombre || `Producto ${detalle.productoId}`
        });
      } else if (edicionDetalle.cantidad !== detalle.cantidad) {
        // Producto modificado (cantidad diferente)
        cambios.push({
          tipo: 'modificado',
          detalle: detalle,
          cantidadAnterior: edicionDetalle.cantidad,
          cantidadNueva: detalle.cantidad,
          subtotalAnterior: edicionDetalle.subtotal,
          subtotalNuevo: detalle.subtotal,
          productoNombre: detalle.producto?.nombre || `Producto ${detalle.productoId}`
        });
      }
    });

    // Buscar productos eliminados (están en edición pero no en detalles actuales)
    this.edicionDetalles.forEach(edicionDetalle => {
      const detalle = detallesMap.get(edicionDetalle.productoId);
      if (!detalle) {
        cambios.push({
          tipo: 'eliminado',
          detalle: edicionDetalle,
          cantidadAnterior: edicionDetalle.cantidad,
          subtotalAnterior: edicionDetalle.subtotal,
          productoNombre: edicionDetalle.producto?.nombre || `Producto ${edicionDetalle.productoId}`
        });
      }
    });

    this.cambios = cambios;
    this.calcularTotales();
  }

  private calcularTotales(): void {
    // Calcular total del recibo actual
    this.totalRecibo = this.detalles.reduce((sum, detalle) => sum + Number(detalle.subtotal ?? 0), 0);

    // Calcular total de edición recibo
    this.totalEdicionRecibo = this.edicionDetalles.reduce((sum, detalle) => sum + Number(detalle.subtotal ?? 0), 0);

    // Calcular diferencia
    this.diferencia = this.totalRecibo - this.totalEdicionRecibo;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('COP', '$').trim();
  }

  getCambiosAgregados(): CambioDetalle[] {
    return this.cambios.filter(c => c.tipo === 'agregado');
  }

  getCambiosEliminados(): CambioDetalle[] {
    return this.cambios.filter(c => c.tipo === 'eliminado');
  }

  getCambiosModificados(): CambioDetalle[] {
    return this.cambios.filter(c => c.tipo === 'modificado');
  }

  getDiferenciaAbsoluta(): number {
    return Math.abs(this.diferencia);
  }

  onMetodoPagoSeleccionado(metodo: MetodoPagoDto): void {
    this.metodoPagoSeleccionado.emit({ metodo, valorReferencia: this.diferencia });
  }

  onFinalizar(): void {
    console.log('onFinalizar called in edicion-recibo component');
    this.finalizar.emit();
  }
}

