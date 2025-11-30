import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { VentasTipoService } from '../service/ventas-tipo.service';

export interface VentaTipoMetodoPagoData {
  // Puede recibir datos opcionales si es necesario
}

export interface VentaTipoMetodoPagoResultado {
  success: boolean;
  registrosCreados: number;
}

interface VentaFormRow {
  metodoPago: MetodoPagoDto;
  totalCtrl: FormControl<number | null>;
}

@Component({
  selector: 'vex-venta-tipo-metodo-pago',
  standalone: true,
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
    ReactiveFormsModule
  ],
  templateUrl: './venta-tipo-metodo-pago.component.html',
  styleUrls: ['./venta-tipo-metodo-pago.component.scss']
})
export class VentaTipoMetodoPagoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('primerInputTotal', { read: ElementRef }) primerInputTotalRef?: ElementRef<HTMLInputElement>;
  
  fechaCtrl = new FormControl<Date | null>(new Date(), [Validators.required]);
  ventasForm: VentaFormRow[] = [];
  displayedColumns: string[] = ['metodoPago', 'total'];
  loading = false;
  cargandoMetodos = false;
  
  // Mapa para almacenar los valores formateados mientras se escribe
  valoresFormateados: Map<number, string> = new Map();
  
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<VentaTipoMetodoPagoComponent, VentaTipoMetodoPagoResultado | null>,
    @Inject(MAT_DIALOG_DATA) data: VentaTipoMetodoPagoData,
    private metodoPagoService: MetodoPagoService,
    private ventasTipoService: VentasTipoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarMetodosPago();
    
    // Escuchar cambios en la fecha para enfocar el primer campo
    this.fechaCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Esperar a que el DOM se actualice
        setTimeout(() => {
          this.enfocarPrimerCampoTotal();
        }, 100);
      });
  }

  ngAfterViewInit(): void {
    // Si ya hay métodos cargados, enfocar el primer campo
    if (this.ventasForm.length > 0) {
      setTimeout(() => {
        this.enfocarPrimerCampoTotal();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarMetodosPago(): void {
    this.cargandoMetodos = true;
    this.metodoPagoService.obtenerMetodosPago()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.cargandoMetodos = false)
      )
      .subscribe({
        next: (metodos) => {
          this.ventasForm = (metodos ?? []).map(metodo => ({
            metodoPago: metodo,
            totalCtrl: new FormControl<number | null>(null, [
              Validators.required,
              Validators.min(0)
            ])
          }));
          
          // Si la fecha ya está seleccionada, enfocar el primer campo
          if (this.fechaCtrl.value) {
            setTimeout(() => {
              this.enfocarPrimerCampoTotal();
            }, 100);
          }
        },
        error: (err) => {
          console.error('Error cargando métodos de pago', err);
          this.snackBar.open('Error al cargar los métodos de pago', 'Cerrar', {
            duration: 3000
          });
        }
      });
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

  parseCurrency(value: string | null | undefined): number {
    if (!value) return 0;
    const digits = String(value)
      .replace(/\s+/g, '')
      .replace(/[^\d]/g, '');
    if (!digits) return 0;
    return Number(digits);
  }

  esFormularioValido(): boolean {
    if (!this.fechaCtrl.value) return false;
    return this.ventasForm.every(row => {
      const total = row.totalCtrl.value;
      return total !== null && total !== undefined && total >= 0;
    });
  }

  registrar(): void {
    if (!this.esFormularioValido() || !this.fechaCtrl.value) {
      this.snackBar.open('Por favor complete todos los campos correctamente', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const fecha = this.formatearFecha(this.fechaCtrl.value);
    const ventasAEnviar = this.ventasForm
      .filter(row => row.totalCtrl.value !== null && row.totalCtrl.value !== undefined && row.totalCtrl.value > 0)
      .map(row => ({
        metodoPagoId: row.metodoPago.id,
        fecha: fecha,
        total: row.totalCtrl.value!
      }));

    if (ventasAEnviar.length === 0) {
      this.snackBar.open('Debe ingresar al menos un valor mayor a cero', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.loading = true;

    // Crear un array de observables para enviar todas las ventas
    const requests = ventasAEnviar.map(venta =>
      this.ventasTipoService.crearVentaTipo(venta)
    );

    // Ejecutar todas las peticiones en paralelo
    forkJoin(requests)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (resultados) => {
          this.snackBar.open(
            `Se registraron ${resultados.length} venta(s) correctamente`,
            'Cerrar',
            { duration: 3000 }
          );
          this.dialogRef.close({
            success: true,
            registrosCreados: resultados.length
          });
        },
        error: (err) => {
          console.error('Error registrando ventas', err);
          this.snackBar.open(
            'Error al registrar las ventas. Por favor intente nuevamente.',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  enfocarPrimerCampoTotal(): void {
    // Esperar un momento para asegurar que el DOM esté listo
    setTimeout(() => {
      if (this.primerInputTotalRef?.nativeElement) {
        this.primerInputTotalRef.nativeElement.focus();
        this.primerInputTotalRef.nativeElement.select();
      }
    }, 150);
  }

  onDatepickerClosed(): void {
    // Cuando se cierra el datepicker (después de seleccionar una fecha), enfocar el primer campo
    if (this.fechaCtrl.value) {
      this.enfocarPrimerCampoTotal();
    }
  }

  onTotalInput(event: Event, row: VentaFormRow, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const numericValue = this.parseCurrency(value);
    
    // Guardar el valor formateado para mostrarlo debajo mientras se escribe
    if (!isNaN(numericValue) && numericValue >= 0) {
      this.valoresFormateados.set(index, this.formatCurrency(numericValue));
      // Actualizar el control con el valor numérico (sin formato)
      row.totalCtrl.setValue(numericValue, { emitEvent: true });
    } else if (value === '' || value === null) {
      this.valoresFormateados.delete(index);
      row.totalCtrl.setValue(null, { emitEvent: true });
    }
  }

  onTotalFocus(event: Event, row: VentaFormRow, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = row.totalCtrl.value;
    
    // Cuando se enfoca, mostrar el valor numérico sin formato para facilitar la edición
    if (value !== null && value !== undefined) {
      input.value = String(value);
    }
  }

  onTotalBlur(row: VentaFormRow, index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = row.totalCtrl.value;
    
    if (value !== null && value !== undefined) {
      // Asegurar que el valor sea un número válido
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0) {
        // Mantener el valor numérico en el control
        row.totalCtrl.setValue(numValue, { emitEvent: false });
        
        // Mostrar el valor formateado como moneda en el input
        const valorFormateado = this.formatCurrency(numValue);
        input.value = valorFormateado;
        
        // Guardar el valor formateado para mostrarlo debajo
        this.valoresFormateados.set(index, valorFormateado);
      }
    } else {
      input.value = '';
      this.valoresFormateados.delete(index);
    }
  }

  obtenerValorFormateado(index: number): string {
    return this.valoresFormateados.get(index) || '';
  }

  onTotalKeydown(event: KeyboardEvent, row: VentaFormRow, index: number): void {
    // Si se presiona Enter en el último campo y el formulario es válido, registrar
    if ((event.key === 'Enter' || event.key === 'NumpadEnter') && index === this.ventasForm.length - 1) {
      event.preventDefault();
      event.stopPropagation();
      
      // Actualizar el valor del campo actual antes de verificar
      const inputValue = (event.target as HTMLInputElement).value;
      const numericValue = this.parseCurrency(inputValue);
      if (!isNaN(numericValue) && numericValue >= 0) {
        row.totalCtrl.setValue(numericValue, { emitEvent: true });
      }
      
      // Esperar un momento para que el valor se actualice y luego verificar
      setTimeout(() => {
        // Verificar que todos los campos tengan al menos un valor (>= 0)
        const todosTienenValor = this.ventasForm.every(r => {
          const total = r.totalCtrl.value;
          return total !== null && total !== undefined && total >= 0;
        });
        
        if (todosTienenValor && this.fechaCtrl.value) {
          this.registrar();
        }
      }, 50);
      return;
    }

    // Permitir teclas de navegación, borrado, etc.
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Permitir números y punto decimal
    if (event.key.match(/[0-9.]/)) {
      return;
    }

    // Permitir Ctrl/Cmd + A, C, V, X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Bloquear cualquier otra tecla
    event.preventDefault();
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}

