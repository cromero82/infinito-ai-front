import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit
} from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteService, ClienteDto, CreateClienteRequest } from '../service/cliente.service';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'cliente-selector',
    imports: [
        CommonModule,
        AsyncPipe,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatAutocompleteModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './cliente-selector.component.html',
    styleUrls: ['./cliente-selector.component.scss']
})
export class ClienteSelectorComponent implements OnInit, AfterViewInit, OnDestroy {
  /** ID del cliente inicialmente seleccionado (opcional). */
  @Input() initialClienteId: number | null = null;

  /** Si true, deshabilita el input (p.ej. mientras se procesa algo en el padre). */
  @Input() disabled = false;

  /** Si true, enfoca automáticamente el input al iniciar. Por defecto true. */
  @Input() autoFocus = true;

  /** Texto del label del campo (p.ej. «Cliente» o «Quién abona»). */
  @Input() label = 'Cliente';

  /** Emite cuando el usuario selecciona o crea un cliente. Null si se limpia. */
  @Output() clienteSelected = new EventEmitter<ClienteDto | null>();

  @ViewChild('clienteInput') clienteInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('clienteInput', { read: MatAutocompleteTrigger }) autocompleteTrigger?: MatAutocompleteTrigger;

  clienteCtrl = new FormControl<ClienteDto | string>('');
  clientes: ClienteDto[] = [];
  filteredClientes$!: Observable<ClienteDto[]>;
  selectedClienteId: number | null = null;
  loadingClientes = false;
  creatingCliente = false;
  isSelectingFromAutocomplete = false;
  mostrarTodosClientes = false;
  mostrarBotonCrearCliente = false;

  private destroy$ = new Subject<void>();
  private clientesUpdated$ = new Subject<void>();

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClientes();

    // Configurar el filtro de clientes
    this.filteredClientes$ = combineLatest([
      this.clienteCtrl.valueChanges.pipe(startWith(''), debounceTime(200), distinctUntilChanged()),
      this.clientesUpdated$.pipe(startWith(null))
    ]).pipe(
      map(([value]) => {
        if (this.mostrarTodosClientes || this.creatingCliente) {
          this.mostrarBotonCrearCliente = false;
          return [...this.clientes];
        }

        let filterValue = '';
        const esString = typeof value === 'string';

        if (esString) {
          filterValue = value.toLowerCase().trim();
        } else if (value && typeof value === 'object' && 'nombre' in value) {
          this.mostrarBotonCrearCliente = false;
          this.cdr.detectChanges();
          return [...this.clientes];
        }

        if (!filterValue) {
          this.mostrarBotonCrearCliente = false;
          this.cdr.detectChanges();
          return [...this.clientes];
        }

        const clientesCopy = [...this.clientes];
        const resultados = clientesCopy.filter(cliente =>
          cliente.nombre.toLowerCase().includes(filterValue) ||
          (cliente.documento && cliente.documento.toLowerCase().includes(filterValue)) ||
          (cliente.telefono && cliente.telefono.toLowerCase().includes(filterValue))
        );

        const debeMostrar = resultados.length === 0 && filterValue.length > 0 && esString;
        this.mostrarBotonCrearCliente = debeMostrar;
        this.cdr.detectChanges();

        return resultados;
      })
    );
  }

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      setTimeout(() => {
        this.clienteInputRef?.nativeElement.focus();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clientesUpdated$.complete();
  }

  /** Permite al padre enfocar el input programáticamente. */
  focus(): void {
    setTimeout(() => {
      this.clienteInputRef?.nativeElement.focus();
    }, 50);
  }

  displayCliente(cliente: ClienteDto | null): string {
    return cliente ? cliente.nombre : '';
  }

  onClienteSelected(cliente: ClienteDto): void {
    this.isSelectingFromAutocomplete = true;
    this.selectedClienteId = cliente.id;
    this.mostrarBotonCrearCliente = false;
    this.clienteCtrl.setValue(cliente, { emitEvent: false });
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.autocompleteTrigger) {
        this.autocompleteTrigger.closePanel();
      }
      if (this.clienteInputRef?.nativeElement) {
        this.clienteInputRef.nativeElement.blur();
      }
      this.cdr.detectChanges();

      this.clienteSelected.emit(cliente);

      setTimeout(() => {
        this.isSelectingFromAutocomplete = false;
      }, 100);
    }, 50);
  }

  onClienteInputKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();

      if (this.isSelectingFromAutocomplete) {
        return;
      }

      const inputValue = (keyboardEvent.target as HTMLInputElement).value.trim();
      if (!inputValue) {
        return;
      }

      const filterValue = inputValue.toLowerCase();
      const existingCliente = this.clientes.find(cliente =>
        cliente.nombre.toLowerCase() === filterValue ||
        (cliente.documento && cliente.documento.toLowerCase() === filterValue)
      );

      if (existingCliente) {
        this.onClienteSelected(existingCliente);
      } else {
        this.createClienteFromInput(inputValue);
      }
    } else {
      const inputValue = (keyboardEvent.target as HTMLInputElement).value;
      if (typeof inputValue === 'string' && inputValue.length > 0) {
        const currentValue = this.clienteCtrl.value;
        if (typeof currentValue === 'object' && currentValue !== null) {
          this.selectedClienteId = null;
        }
      }
    }
  }

  onClienteInputBlur(): void {
    // El autocomplete se cierra automáticamente al perder focus
  }

  limpiarCliente(): void {
    this.clienteCtrl.setValue('', { emitEvent: true });
    this.selectedClienteId = null;
    this.mostrarBotonCrearCliente = false;
    if (this.autocompleteTrigger) {
      this.autocompleteTrigger.closePanel();
    }
    this.clienteSelected.emit(null);
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

  // ─── Privados ───────────────────────────────────────────────

  private loadClientes(): void {
    this.loadingClientes = true;
    this.clienteService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (clientes) => {
        this.clientes = [...(clientes || [])];
        this.clientesUpdated$.next();

        // Si hay un initialClienteId, pre-seleccionar ese cliente
        if (this.initialClienteId) {
          const found = this.clientes.find(c => c.id === this.initialClienteId);
          if (found) {
            this.clienteCtrl.setValue(found, { emitEvent: false });
            this.selectedClienteId = found.id;
          }
        } else if (this.clientes.length > 0) {
          // Seleccionar el primer cliente por defecto solo si no hay initial
          this.clienteCtrl.setValue(this.clientes[0].nombre, { emitEvent: false });
          this.selectedClienteId = this.clientes[0].id;
        }
        this.loadingClientes = false;
      },
      error: (err) => {
        console.error('Error loading clientes', err);
        this.loadingClientes = false;
      }
    });
  }

  private createClienteFromInput(nombre: string): void {
    this.creatingCliente = true;

    const parts = nombre.split(' - ');
    const clienteNombre = parts[0].trim();
    const documento = parts.length > 1 ? parts[1].trim() : `${'0'.repeat(9)}`;

    const nuevoCliente: CreateClienteRequest = {
      nombre: clienteNombre,
      documento: documento,
      telefono: ''
    };

    this.clienteService.createCliente(nuevoCliente).pipe(takeUntil(this.destroy$)).subscribe({
      next: (clienteCreado) => {
        this.clientes = [...this.clientes, clienteCreado];
        this.selectedClienteId = clienteCreado.id;
        this.clienteCtrl.setValue(clienteCreado, { emitEvent: false });

        this.mostrarTodosClientes = true;
        this.clientesUpdated$.next();
        this.mostrarTodosClientes = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          if (this.autocompleteTrigger) {
            this.autocompleteTrigger.closePanel();
          }
          if (this.clienteInputRef?.nativeElement) {
            this.clienteInputRef.nativeElement.blur();
          }
          this.cdr.detectChanges();

          this.clienteSelected.emit(clienteCreado);
        }, 100);

        this.creatingCliente = false;
      },
      error: (err) => {
        console.error('Error creating cliente', err);
        this.creatingCliente = false;
      }
    });
  }
}
