import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteService, ClienteDto, CreateClienteRequest } from '../service/cliente.service';
import { MetodoPagoService, MetodoPagoDto } from '../service/metodo-pago.service';
import { HistorialReciboService, QuickReciboRequest } from '../service/historial-recibo.service';
import { Subject, Observable, combineLatest, of } from 'rxjs';
import { takeUntil, map, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

export interface QuickReciboData {
  sesionId: number;
}

@Component({
  selector: 'vex-quick-recibo',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './quick-recibo.component.html',
  styleUrls: ['./quick-recibo.component.scss']
})
export class QuickReciboComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('totalInput') totalInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('clienteInput') clienteInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('pagaConInput') pagaConInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) autocompleteTrigger?: MatAutocompleteTrigger;
  
  clienteCtrl = new FormControl<ClienteDto | string>('');
  totalCtrl = new FormControl<string>('');
  pagaConCtrl = new FormControl<string>('');
  cambio = 0;
  pagoInsuficiente = false;
  totalTieneFocus = false;
  clientes: ClienteDto[] = [];
  filteredClientes$!: Observable<ClienteDto[]>;
  selectedClienteId: number | null = null;
  metodosPago: MetodoPagoDto[] = [];
  selectedMetodoPagoId: number | null = null;
  loading = false;
  loadingClientes = false;
  loadingMetodos = false;
  creatingCliente = false;
  isSelectingFromAutocomplete = false;
  mostrarTodosClientes = false;
  error: string | null = null;
  mostrarBotonCrearCliente = false;
  
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  private destroy$ = new Subject<void>();
  private clientesUpdated$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<QuickReciboComponent>,
    private clienteService: ClienteService,
    private metodoPagoService: MetodoPagoService,
    private historialReciboService: HistorialReciboService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: QuickReciboData
  ) {}

  ngOnInit(): void {
    this.loadClientes();
    this.loadMetodosPago();
    
    // Configurar el filtro de clientes
    // Combinamos los cambios en el control con las actualizaciones de la lista de clientes
    this.filteredClientes$ = combineLatest([
      this.clienteCtrl.valueChanges.pipe(startWith(''), debounceTime(200), distinctUntilChanged()),
      this.clientesUpdated$.pipe(startWith(null))
    ]).pipe(
      map(([value]) => {
        // Si se está creando un cliente o se debe mostrar todos, mostrar todos los clientes
        if (this.mostrarTodosClientes || this.creatingCliente) {
          this.mostrarBotonCrearCliente = false;
          return [...this.clientes];
        }
        
        // Extraer el string del valor (puede ser ClienteDto o string)
        let filterValue = '';
        const esString = typeof value === 'string';
        
        if (esString) {
          filterValue = value.toLowerCase().trim();
        } else if (value && typeof value === 'object' && 'nombre' in value) {
          // Si es un objeto ClienteDto, ocultar botón y mostrar todos los clientes
          this.mostrarBotonCrearCliente = false;
          this.cdr.detectChanges();
          return [...this.clientes];
        }
        
        // Si no hay filtro, mostrar todos los clientes
        if (!filterValue) {
          this.mostrarBotonCrearCliente = false;
          this.cdr.detectChanges();
          return [...this.clientes];
        }
        
        // Filtrar sobre una copia de la lista actual de clientes para asegurar reactividad
        const clientesCopy = [...this.clientes];
        const resultados = clientesCopy.filter(cliente => 
          cliente.nombre.toLowerCase().includes(filterValue) ||
          (cliente.documento && cliente.documento.toLowerCase().includes(filterValue)) ||
          (cliente.telefono && cliente.telefono.toLowerCase().includes(filterValue))
        );
        
        // Mostrar botón de crear si no hay resultados, hay texto escrito y es un string (no objeto seleccionado)
        const debeMostrar = resultados.length === 0 && filterValue.length > 0 && esString;
        this.mostrarBotonCrearCliente = debeMostrar;
        console.log('=== DEBUG BOTON CREAR ===');
        console.log('resultados.length:', resultados.length);
        console.log('filterValue:', filterValue);
        console.log('esString:', esString);
        console.log('mostrarBotonCrearCliente:', this.mostrarBotonCrearCliente);
        this.cdr.detectChanges();
        
        return resultados;
      })
    );

    // Configurar el cálculo del cambio cuando cambia "Paga con"
    this.pagaConCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calcularCambio();
    });
    
    // También recalcular cuando cambia el total (si es efectivo)
    this.totalCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.selectedMetodoPagoId === 1) {
        // Si es efectivo y el total cambia, actualizar "Paga con" solo si está vacío o es igual al total anterior
        const totalValue = this.parseCurrencyToNumber(this.totalCtrl.value || '');
        const pagaConValue = this.parseCurrencyToNumber(this.pagaConCtrl.value || '');
        
        // Si "Paga con" está vacío o es igual al total anterior, actualizarlo al nuevo total
        if (totalValue > 0) {
          if (pagaConValue === 0 || pagaConValue === this.parseCurrencyToNumber(this.totalCtrl.value || '')) {
            this.pagaConCtrl.setValue(this.formatCurrency(totalValue), { emitEvent: false });
          }
        }
        this.calcularCambio();
      }
    });
  }

  ngAfterViewInit(): void {
    // Enfocar el input de cliente al iniciar
    setTimeout(() => {
      this.clienteInputRef?.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clientesUpdated$.complete();
  }

  private loadClientes(): void {
    this.loadingClientes = true;
    this.clienteService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (clientes) => {
        // Crear nueva referencia del array para asegurar reactividad
        this.clientes = [...(clientes || [])];
        console.log('Clientes cargados:', this.clientes.length);
        // Notificar que la lista de clientes se actualizó
        this.clientesUpdated$.next();
        // Select first client by default
        if (this.clientes.length > 0) {
          this.clienteCtrl.setValue(this.clientes[0].nombre, { emitEvent: false });
          this.selectedClienteId = this.clientes[0].id;
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
    const noEstaCargando = !this.loading && !this.creatingCliente;
    
    // Si es efectivo (id: 1), validar que el pago sea suficiente
    if (this.selectedMetodoPagoId === 1) {
      const pagaCon = this.parseCurrencyToNumber(this.pagaConCtrl.value || '');
      const total = this.parseCurrencyToNumber(this.totalCtrl.value || '');
      const pagoSuficiente = pagaCon >= total && pagaCon > 0;
      return tieneCliente && tieneMetodoPago && tieneTotal && pagoSuficiente && noEstaCargando;
    }
    
    return tieneCliente && tieneMetodoPago && tieneTotal && noEstaCargando;
  }

  displayCliente(cliente: ClienteDto | null): string {
    return cliente ? cliente.nombre : '';
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

  onClienteSelected(cliente: ClienteDto): void {
    console.log('=== onClienteSelected LLAMADO ===');
    console.log('Cliente:', cliente);
    
    this.isSelectingFromAutocomplete = true;
    this.selectedClienteId = cliente.id;
    this.mostrarBotonCrearCliente = false; // Ocultar botón cuando se selecciona un cliente
    console.log('selectedClienteId establecido:', this.selectedClienteId);
    
    // Establecer el valor del control con el objeto completo (necesario con displayWith)
    // Esto hará que el displayWith muestre el nombre correctamente
    this.clienteCtrl.setValue(cliente, { emitEvent: false });
    console.log('Valor del control establecido con objeto completo');
    
    // Forzar detección de cambios para actualizar la vista del input
    this.cdr.detectChanges();
    
    // Cerrar el autocomplete usando el trigger
    setTimeout(() => {
      // Cerrar el panel del autocomplete usando el trigger
      if (this.autocompleteTrigger) {
        this.autocompleteTrigger.closePanel();
        console.log('Autocomplete cerrado usando closePanel()');
      }
      
      // También hacer blur en el input por si acaso
      if (this.clienteInputRef?.nativeElement) {
        this.clienteInputRef.nativeElement.blur();
      }
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Pasar focus al campo total después de cerrar el autocomplete
      setTimeout(() => {
        console.log('=== PASANDO FOCUS AL CAMPO TOTAL ===');
        const totalInput = this.totalInputRef?.nativeElement;
        if (totalInput) {
          totalInput.focus();
          totalInput.select();
          console.log('✅ Focus pasado exitosamente al campo Total');
        } else {
          console.error('❌ ERROR: totalInputRef no disponible');
        }
        this.isSelectingFromAutocomplete = false;
      }, 100);
    }, 50);
  }

  onClienteInputKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      // SIEMPRE prevenir el comportamiento por defecto
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      
      // Si el usuario está seleccionando del autocomplete, no crear cliente
      if (this.isSelectingFromAutocomplete) {
        return;
      }

      const inputValue = (keyboardEvent.target as HTMLInputElement).value.trim();
      
      if (!inputValue) {
        return;
      }

      // Verificar si el cliente ya existe en la lista filtrada
      const filterValue = inputValue.toLowerCase();
      const existingCliente = this.clientes.find(cliente => 
        cliente.nombre.toLowerCase() === filterValue ||
        (cliente.documento && cliente.documento.toLowerCase() === filterValue)
      );

      if (existingCliente) {
        // Si existe, seleccionarlo
        this.onClienteSelected(existingCliente);
      } else {
        // Si no existe, crear nuevo cliente
        this.createClienteFromInput(inputValue);
      }
    } else {
      // Cuando el usuario está escribiendo, resetear selectedClienteId si el valor es un string
      const inputValue = (keyboardEvent.target as HTMLInputElement).value;
      if (typeof inputValue === 'string' && inputValue.length > 0) {
        // Si el usuario está escribiendo texto nuevo, resetear la selección
        const currentValue = this.clienteCtrl.value;
        if (typeof currentValue === 'object' && currentValue !== null) {
          // Si había un cliente seleccionado y ahora está escribiendo, resetear
          this.selectedClienteId = null;
        }
      }
    }
  }

  onClienteInputBlur(): void {
    // Este método se llama cuando el input pierde el focus
    // No hacer nada especial aquí, solo asegurar que el autocomplete se cierre
    // El autocomplete se cierra automáticamente cuando el input pierde el focus
  }

  limpiarCliente(): void {
    console.log('Limpiando cliente...');
    // Limpiar el valor del control
    this.clienteCtrl.setValue('', { emitEvent: true });
    // Resetear la selección
    this.selectedClienteId = null;
    // Ocultar botón de crear
    this.mostrarBotonCrearCliente = false;
    // Cerrar el autocomplete si está abierto
    if (this.autocompleteTrigger) {
      this.autocompleteTrigger.closePanel();
    }
    // Enfocar el input del cliente después de limpiar
    setTimeout(() => {
      if (this.clienteInputRef?.nativeElement) {
        this.clienteInputRef.nativeElement.focus();
      }
    }, 100);
  }

  crearClienteDesdeBoton(): void {
    const inputValue = this.clienteCtrl.value;
    if (typeof inputValue === 'string' && inputValue.trim()) {
      this.createClienteFromInput(inputValue.trim());
    }
  }

  private createClienteFromInput(nombre: string): void {
    this.creatingCliente = true;
    this.error = null;

    // Extraer documento si está en el formato "NOMBRE - DOCUMENTO" o similar
    const parts = nombre.split(' - ');
    const clienteNombre = parts[0].trim();
    // Generar documento con formato 000000000 (9 ceros)
    const documento = parts.length > 1 ? parts[1].trim() : `${'0'.repeat(9)}`;

    const nuevoCliente: CreateClienteRequest = {
      nombre: clienteNombre,
      documento: documento,
      telefono: ''
    };

    this.clienteService.createCliente(nuevoCliente).pipe(takeUntil(this.destroy$)).subscribe({
      next: (clienteCreado) => {
        console.log('=== CLIENTE CREADO EXITOSAMENTE ===');
        console.log('Cliente:', clienteCreado);
        
        // Agregar el cliente a la lista
        this.clientes = [...this.clientes, clienteCreado];
        console.log('Cliente agregado. Total:', this.clientes.length);
        
        // SELECCIONAR EL CLIENTE INMEDIATAMENTE
        this.selectedClienteId = clienteCreado.id;
        console.log('selectedClienteId establecido:', this.selectedClienteId);
        
        // Establecer el valor del control con el objeto completo INMEDIATAMENTE
        // Esto es necesario porque usamos displayWith - debe ser el objeto completo
        this.clienteCtrl.setValue(clienteCreado, { emitEvent: false });
        console.log('Valor del control establecido con objeto completo:', clienteCreado);
        
        // Actualizar el observable para que el cliente aparezca en la lista
        this.mostrarTodosClientes = true;
        this.clientesUpdated$.next();
        this.mostrarTodosClientes = false;
        
        // Forzar detección de cambios para actualizar la vista
        this.cdr.detectChanges();
        
        // Cerrar el autocomplete usando el trigger
        setTimeout(() => {
          // Cerrar el panel del autocomplete usando el trigger
          if (this.autocompleteTrigger) {
            this.autocompleteTrigger.closePanel();
            console.log('Autocomplete cerrado usando closePanel()');
          }
          
          // También hacer blur en el input por si acaso
          if (this.clienteInputRef?.nativeElement) {
            this.clienteInputRef.nativeElement.blur();
          }
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
          
          // Pasar focus al campo total después de cerrar el autocomplete
          setTimeout(() => {
            const totalInput = this.totalInputRef?.nativeElement;
            if (totalInput) {
              totalInput.focus();
              totalInput.select();
              console.log('✅ Focus pasado al campo Total');
            }
          }, 100);
        }, 100);
        
        this.creatingCliente = false;
      },
      error: (err) => {
        console.error('Error creating cliente', err);
        this.error = 'No se pudo crear el cliente. Verifique que el nombre sea válido.';
        this.creatingCliente = false;
      }
    });
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

