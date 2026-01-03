import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  CargueProductosService, 
  CargueProductoDto, 
  CargueProductoConflictoDto,
  TipoConflictoId,
  TipoConflictoLabels,
  ConflictoParsed,
  ConflictoItem
} from './service/cargue-productos.service';
import { CargueProductoModalComponent } from './cargue-producto-modal/cargue-producto-modal.component';
import { RelationalProductService } from '../products/service/relational-product.service';
import { ProductEditComponent } from '../products/product-edit/product-edit.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'vex-cargue-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cargue-productos.component.html',
  styleUrls: ['./cargue-productos.component.scss']
})
export class CargueProductosComponent implements OnInit, OnDestroy {
  cargueProductos: CargueProductoDto[] = [];
  loading = false;
  error: string | null = null;

  // Detalles state
  selectedCargueProductoId: number | null = null;
  conflictos: CargueProductoConflictoDto[] = [];
  conflictosParsed: ConflictoParsed[] = [];
  conflictosLoading = false;
  conflictosError: string | null = null;
  registrandoProducto: { [key: string]: boolean } = {}; // Para trackear qué item está siendo registrado
  productosExistentes: { [key: string]: boolean } = {}; // Para trackear qué productos ya existen
  verificandoProducto: { [key: string]: boolean } = {}; // Para trackear qué productos se están verificando
  resolviendoConflicto: { [key: number]: boolean } = {}; // Para trackear qué conflictos se están resolviendo
  
  // Filtro para mostrar solo conflictos no resueltos
  unicamenteNoResueltosCtrl = new FormControl<boolean>(true);

  // Ordenamiento
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  private destroy$ = new Subject<void>();

  constructor(
    private cargueProductosService: CargueProductosService,
    private dialog: MatDialog,
    private relationalProductService: RelationalProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCargueProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCargueProductos(): void {
    this.loading = true;
    this.error = null;

    this.cargueProductosService.getCargueProductos().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (cargues) => {
        this.cargueProductos = cargues;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cargue productos', err);
        this.error = 'Error al cargar los cargues de productos.';
        this.loading = false;
      }
    });
  }

  selectCargueProducto(cargue: CargueProductoDto): void {
    if (this.selectedCargueProductoId === cargue.id) {
      return; // Already selected
    }

    this.selectedCargueProductoId = cargue.id;
    this.conflictos = [];
    this.conflictosError = null;
    this.loadConflictos(cargue.id);
  }

  loadConflictos(cargueProductoId: number): void {
    this.conflictosLoading = true;
    this.conflictosError = null;

    const unicamenteNoResueltos = this.unicamenteNoResueltosCtrl.value ?? true;

    this.cargueProductosService.getConflictosByCargueProductoId(cargueProductoId, unicamenteNoResueltos).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (conflictos) => {
        this.conflictos = conflictos;
        this.conflictosParsed = conflictos.map(conflicto => this.parseConflicto(conflicto));
        // Aplicar ordenamiento si existe
        if (this.sortColumn) {
          this.applySort();
        }
        // Limpiar estados de verificación
        this.productosExistentes = {};
        this.verificandoProducto = {};
        this.resolviendoConflicto = {};
        this.conflictosLoading = false;
      },
      error: (err) => {
        console.error('Error loading conflictos', err);
        this.conflictosError = 'Error al cargar los conflictos.';
        this.conflictosLoading = false;
      }
    });
  }

  onUnicamenteNoResueltosChange(): void {
    // Cuando cambia el toggle, recargar los conflictos si hay un cargue seleccionado
    if (this.selectedCargueProductoId) {
      this.loadConflictos(this.selectedCargueProductoId);
    }
  }

  parseConflicto(conflicto: CargueProductoConflictoDto): ConflictoParsed {
    const parsed: ConflictoParsed = {
      conflicto: conflicto,
      items: []
    };

    // Extraer nombre y precio del campo nombreProducto si viene en formato "NOMBRE; Precio: $XXX.XX"
    let nombreExtraido: string | undefined;
    let precioExtraido: number | undefined;

    if (conflicto.nombreProducto) {
      // Buscar patrón "NOMBRE; Precio: $XXX.XX"
      const nombreMatch = conflicto.nombreProducto.match(/^([^;]+)(?:;\s*Precio:\s*\$([\d,]+\.?\d*))?/);
      if (nombreMatch) {
        nombreExtraido = nombreMatch[1].trim();
        if (nombreMatch[2]) {
          // Remover comas y convertir a número
          precioExtraido = parseFloat(nombreMatch[2].replace(/,/g, ''));
        }
      } else {
        // Si no tiene el formato, usar el nombre completo
        nombreExtraido = conflicto.nombreProducto;
      }
    }

    parsed.nombreExtraido = nombreExtraido;
    parsed.precioExtraido = precioExtraido;

    // Parsear datosConflicto
    const datosParsed = this.parseDatosConflicto(conflicto.datosConflicto);

    if (Array.isArray(datosParsed)) {
      // Para IGUAL_NOMBRE_Y_CODIGO_BARRAS, el array puede tener solo un objeto con "nombre"
      if (conflicto.tipoConflictoId === TipoConflictoId.IGUAL_NOMBRE_Y_CODIGO_BARRAS) {
        // Solo crear un item con el nombre del primer objeto
        if (datosParsed.length > 0) {
          const item = datosParsed[0];
          const conflictoItem: ConflictoItem = {};
          Object.entries(item).forEach(([key, value]) => {
            if (key.toLowerCase().includes('nombre')) {
              conflictoItem.nombre = String(value);
            } else {
              conflictoItem[key] = value;
            }
          });
          if (Object.keys(conflictoItem).length > 0) {
            parsed.items.push(conflictoItem);
          }
        }
      } else {
        // Para otros tipos, combinar los campos: primer objeto tiene codigo barras y precio, segundo tiene codigo barras 2nd y precio 2nd
        const conflictoItem1: ConflictoItem = {};
        const conflictoItem2: ConflictoItem = {};
        
        datosParsed.forEach((item: any, index: number) => {
          Object.entries(item).forEach(([key, value]) => {
            // Normalizar nombres de campos
            if (key.toLowerCase().includes('codigo') && key.toLowerCase().includes('barras')) {
              if (key.includes('2nd') || key.includes(' 2nd')) {
                conflictoItem2['codigoBarras2nd'] = String(value);
              } else {
                conflictoItem1.codigoBarras = String(value);
              }
            } else if (key.toLowerCase().includes('precio')) {
              const precioNum = this.parsePrecio(String(value));
              if (key.includes('2nd') || key.includes(' 2nd')) {
                conflictoItem2['precio2nd'] = precioNum;
              } else {
                conflictoItem1.precio = precioNum;
              }
            } else if (key.toLowerCase().includes('nombre')) {
              // El nombre puede ir en cualquier item
              if (!conflictoItem1.nombre) {
                conflictoItem1.nombre = String(value);
              }
              if (!conflictoItem2.nombre) {
                conflictoItem2.nombre = String(value);
              }
            } else {
              // Otros campos
              if (index === 0) {
                conflictoItem1[key] = value;
              } else {
                conflictoItem2[key] = value;
              }
            }
          });
        });

        // Agregar items solo si tienen datos
        if (Object.keys(conflictoItem1).length > 0) {
          parsed.items.push(conflictoItem1);
        }
        if (Object.keys(conflictoItem2).length > 0) {
          parsed.items.push(conflictoItem2);
        }
      }
    } else if (typeof datosParsed === 'object' && datosParsed !== null) {
      // Si es objeto simple, crear un solo item
      const conflictoItem: ConflictoItem = {};
      Object.entries(datosParsed).forEach(([key, value]) => {
        if (key.toLowerCase().includes('nombre')) {
          conflictoItem.nombre = String(value);
        } else {
          conflictoItem[key] = value;
        }
      });
      parsed.items.push(conflictoItem);
    } else if (typeof datosParsed === 'string') {
      // Si es string simple (como "BARRILETE")
      parsed.items.push({
        nombre: datosParsed
      });
    }

    // Si no hay items pero hay nombre extraído, crear un item con ese nombre
    if (parsed.items.length === 0 && nombreExtraido) {
      parsed.items.push({
        nombre: nombreExtraido,
        precio: precioExtraido
      });
    }

    return parsed;
  }

  parsePrecio(precioStr: string): number {
    // Remover símbolos de moneda, comas y espacios
    const cleaned = precioStr.replace(/[\$,\s]/g, '');
    return parseFloat(cleaned) || 0;
  }

  getSelectedCargueProducto(): CargueProductoDto | null {
    if (!this.selectedCargueProductoId) {
      return null;
    }
    return this.cargueProductos.find(c => c.id === this.selectedCargueProductoId) || null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase();

    if (dateOnly.getTime() === today.getTime()) {
      return `Hoy, ${timeStr}`;
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return `Ayer, ${timeStr}`;
    } else {
      // Check if it's within the last 7 days (show day name)
      const daysDiff = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = daysOfWeek[date.getDay()];
        return `${dayName}, ${timeStr}`;
      } else {
        // Show date format: "14-Nov, 3:17 pm"
        const day = date.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthName = months[date.getMonth()];
        return `${day}-${monthName}, ${timeStr}`;
      }
    }
  }

  getTipoConflictoLabel(tipoConflictoId: number): string {
    return TipoConflictoLabels[tipoConflictoId as TipoConflictoId] || 'Desconocido';
  }

  getNombreProductoFormateado(conflictoParsed: ConflictoParsed): string {
    const nombreProducto = conflictoParsed.conflicto.nombreProducto;
    if (!nombreProducto) {
      return 'N/A';
    }

    // Para el tipo IGUAL_NOMBRE_Y_CODIGO_BARRAS, preservar el formato con salto de línea
    if (conflictoParsed.conflicto.tipoConflictoId === TipoConflictoId.IGUAL_NOMBRE_Y_CODIGO_BARRAS) {
      // Reemplazar "; " con ";<br>" para preservar el salto de línea
      return nombreProducto.replace(/;\s*/g, ';<br>');
    }

    // Para otros tipos, usar el nombre extraído o el nombre completo
    return conflictoParsed.nombreExtraido || nombreProducto;
  }

  esTipoIgualNombreYCodigoBarras(conflictoParsed: ConflictoParsed): boolean {
    return conflictoParsed.conflicto.tipoConflictoId === TipoConflictoId.IGUAL_NOMBRE_Y_CODIGO_BARRAS;
  }

  esTipoDosProductosNombresIguales(conflictoParsed: ConflictoParsed): boolean {
    return conflictoParsed.conflicto.tipoConflictoId === TipoConflictoId.DOS_PRODUCTOS_NOMBRES_IGUALES;
  }

  parseDatosConflicto(datosConflicto: string): any {
    try {
      return JSON.parse(datosConflicto);
    } catch (e) {
      return null;
    }
  }

  formatDatosConflicto(datosConflicto: string): string {
    const parsed = this.parseDatosConflicto(datosConflicto);
    if (!parsed) {
      return datosConflicto;
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      const separator = '-------------------';
      const allEntries: Array<[string, any]> = [];
      
      // Recopilar todas las entradas de todos los objetos
      parsed.forEach((item: any) => {
        const entries = Object.entries(item);
        allEntries.push(...entries);
      });
      
      // Agrupar por orden: primero los que no tienen "2nd", luego los que tienen "2nd"
      const primaryEntries: Array<[string, any]> = [];
      const secondaryEntries: Array<[string, any]> = [];
      
      allEntries.forEach(([key, value]) => {
        if (key.includes('2nd') || key.includes(' 2nd')) {
          secondaryEntries.push([key, value]);
        } else {
          primaryEntries.push([key, value]);
        }
      });
      
      const formattedGroups: string[] = [];
      
      // Primer grupo: campos primarios (sin "2nd")
      if (primaryEntries.length > 0) {
        const primaryLines = primaryEntries.map(([key, value]) => `${key}: ${value}`).join('\n');
        formattedGroups.push(primaryLines);
      }
      
      // Segundo grupo: campos secundarios (con "2nd"), separados por línea
      if (secondaryEntries.length > 0) {
        const secondaryLines = secondaryEntries.map(([key, value]) => `${key}: ${value}`).join('\n');
        formattedGroups.push(separator + '\n' + secondaryLines);
      }
      
      return formattedGroups.join('\n');
    }

    // Si no es array, formatear como objeto simple
    if (typeof parsed === 'object' && parsed !== null) {
      const entries = Object.entries(parsed);
      return entries.map(([key, value]) => `${key}: ${value}`).join('\n');
    }

    return String(parsed);
  }

  getConflictosResueltos(): number {
    return this.conflictos.filter(c => c.resuelto).length;
  }

  getConflictosPendientes(): number {
    return this.conflictos.filter(c => !c.resuelto).length;
  }

  getPorcentajeResueltos(cargue: CargueProductoDto): number {
    if (!cargue.totalConflictos || cargue.totalConflictos === 0) {
      return 0;
    }
    const resueltos = cargue.totalConflictosResultos || 0;
    return Math.round((resueltos / cargue.totalConflictos) * 100);
  }

  tieneConflictosResueltos(cargue: CargueProductoDto): boolean {
    return (cargue.totalConflictosResultos || 0) > 0;
  }

  registrarProducto(conflictoIndex: number, itemIndex: number): void {
    const conflictoParsed = this.conflictosParsed[conflictoIndex];
    if (!conflictoParsed || !conflictoParsed.items[itemIndex]) {
      return;
    }

    const item = conflictoParsed.items[itemIndex];
    const conflicto = conflictoParsed.conflicto;
    
    // Construir el objeto del producto
    // Para el primer item usar codigoBarras y precio, para el segundo usar codigoBarras2nd y precio2nd
    let barcode = '';
    let precio = 0;

    if (itemIndex === 0) {
      barcode = item.codigoBarras || '';
      precio = item.precio || conflictoParsed.precioExtraido || 0;
    } else {
      barcode = item['codigoBarras2nd'] || '';
      precio = item['precio2nd'] || 0;
    }

    // El nombre siempre viene del conflicto (nombreExtraido o nombreProducto)
    let nombre = conflictoParsed.nombreExtraido || conflicto.nombreProducto || item.nombre || '';
    
    // Si el nombre viene con formato "NOMBRE; Precio: $XXX", extraer solo el nombre
    if (nombre && nombre.includes(';')) {
      nombre = nombre.split(';')[0].trim();
    }

    // Solo verificar si el producto existe para conflictos tipo DOS_PRODUCTOS_NOMBRES_IGUALES
    // y solo cuando hay código de barras
    if (conflicto.tipoConflictoId === TipoConflictoId.DOS_PRODUCTOS_NOMBRES_IGUALES && 
        barcode && barcode.trim().length > 0) {
      const key = `${conflictoIndex}-${itemIndex}`;
      this.verificandoProducto[key] = true;

      this.relationalProductService.searchByBarcode(barcode).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (producto) => {
          this.verificandoProducto[key] = false;
          
          if (producto && producto.id) {
            // El producto existe, abrir en modo edición
            this.productosExistentes[key] = true;
            
            const dialogRef = this.dialog.open(ProductEditComponent, {
              width: '600px',
              data: {
                id: producto.id,
                nombre: producto.nombre,
                barcode: producto.barcode,
                precio: producto.precio,
                precioCompra: producto.precioCompra || 0,
                foto: producto.foto || '',
                company: producto.company
              }
            });

            dialogRef.afterClosed().subscribe((result) => {
              if (result && result._edit) {
                // Producto fue actualizado, recargar conflictos
                if (this.selectedCargueProductoId) {
                  this.loadConflictos(this.selectedCargueProductoId);
                }
              }
            });
          } else {
            // El producto no existe, abrir en modo creación
            this.productosExistentes[key] = false;
            this.abrirModalRegistroProducto(conflictoIndex, itemIndex, nombre, barcode, precio, conflicto);
          }
        },
        error: (err) => {
          console.error('Error al buscar producto', err);
          this.verificandoProducto[key] = false;
          this.productosExistentes[key] = false;
          
          // Si es 404 o cualquier error, asumir que no existe y permitir crear
          this.abrirModalRegistroProducto(conflictoIndex, itemIndex, nombre, barcode, precio, conflicto);
        }
      });
    } else {
      // Para otros tipos de conflicto o sin código de barras, abrir directamente en modo creación
      this.abrirModalRegistroProducto(conflictoIndex, itemIndex, nombre, barcode, precio, conflicto);
    }
  }

  private abrirModalRegistroProducto(
    conflictoIndex: number, 
    itemIndex: number, 
    nombre: string, 
    barcode: string, 
    precio: number, 
    conflicto: CargueProductoConflictoDto
  ): void {
    // Abrir el modal de edición en modo creación (sin ID) para que el usuario pueda editar antes de registrar
    const dialogRef = this.dialog.open(ProductEditComponent, {
      width: '600px',
      disableClose: false,
      data: {
        // No incluir ID para que sea modo creación
        nombre: nombre,
        barcode: barcode,
        precio: precio,
        precioCompra: 0,
        foto: ''
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.id) {
        // Producto fue creado exitosamente
        this.snackBar.open('Producto registrado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right'
        });
        
        // Si es tipo IGUAL_NOMBRE_Y_CODIGO_BARRAS, resolver el conflicto automáticamente
        if (conflicto.tipoConflictoId === TipoConflictoId.IGUAL_NOMBRE_Y_CODIGO_BARRAS) {
          this.resolverConflicto(conflictoIndex, conflicto.id);
        } else {
          // Para otros tipos, solo recargar conflictos
          if (this.selectedCargueProductoId) {
            this.loadConflictos(this.selectedCargueProductoId);
          }
        }
      }
    });
  }

  resolverConflicto(conflictoIndex: number, conflictoId: number): void {
    this.resolviendoConflicto[conflictoIndex] = true;
    
    this.cargueProductosService.resolverConflicto(conflictoId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.resolviendoConflicto[conflictoIndex] = false;
        
        // Eliminar el conflicto de la lista
        this.conflictosParsed = this.conflictosParsed.filter((_, index) => index !== conflictoIndex);
        this.conflictos = this.conflictos.filter(c => c.id !== conflictoId);
        
        // Actualizar el contador de resueltos en el cargue seleccionado
        const cargueSeleccionado = this.cargueProductos.find(c => c.id === this.selectedCargueProductoId);
        if (cargueSeleccionado) {
          cargueSeleccionado.totalConflictosResultos = (cargueSeleccionado.totalConflictosResultos || 0) + 1;
        }
        
        this.snackBar.open('Conflicto resuelto correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right'
        });
      },
      error: (err) => {
        console.error('Error al resolver conflicto', err);
        this.resolviendoConflicto[conflictoIndex] = false;
        
        this.snackBar.open(
          'Error al resolver el conflicto. Por favor intente nuevamente.',
          'Cerrar',
          {
            duration: 5000,
            horizontalPosition: 'right',
            panelClass: ['error-snackbar']
          }
        );
        // Aún así recargar conflictos para actualizar el estado
        if (this.selectedCargueProductoId) {
          this.loadConflictos(this.selectedCargueProductoId);
        }
      }
    });
  }

  isResolviendoConflicto(conflictoIndex: number): boolean {
    return this.resolviendoConflicto[conflictoIndex] || false;
  }

  isRegistrando(conflictoIndex: number, itemIndex: number): boolean {
    const key = `${conflictoIndex}-${itemIndex}`;
    return this.registrandoProducto[key] || false;
  }

  tieneCodigoBarras(conflictoIndex: number, itemIndex: number): boolean {
    const conflictoParsed = this.conflictosParsed[conflictoIndex];
    if (!conflictoParsed || !conflictoParsed.items[itemIndex]) {
      return false;
    }

    const item = conflictoParsed.items[itemIndex];
    if (itemIndex === 0) {
      return !!(item.codigoBarras && item.codigoBarras.trim().length > 0);
    } else {
      return !!(item['codigoBarras2nd'] && item['codigoBarras2nd'].trim().length > 0);
    }
  }


  productoExiste(conflictoIndex: number, itemIndex: number): boolean {
    const key = `${conflictoIndex}-${itemIndex}`;
    return this.productosExistentes[key] || false;
  }

  estaVerificandoProducto(conflictoIndex: number, itemIndex: number): boolean {
    const key = `${conflictoIndex}-${itemIndex}`;
    return this.verificandoProducto[key] || false;
  }

  editarProducto(conflictoIndex: number, itemIndex: number): void {
    const conflictoParsed = this.conflictosParsed[conflictoIndex];
    if (!conflictoParsed || !conflictoParsed.items[itemIndex]) {
      return;
    }

    // Solo permitir editar para conflictos tipo DOS_PRODUCTOS_NOMBRES_IGUALES
    if (conflictoParsed.conflicto.tipoConflictoId !== TipoConflictoId.DOS_PRODUCTOS_NOMBRES_IGUALES) {
      return;
    }

    const item = conflictoParsed.items[itemIndex];
    // Para el primer item usar codigoBarras, para el segundo usar codigoBarras2nd
    let barcode = '';
    if (itemIndex === 0) {
      barcode = item.codigoBarras || '';
    } else {
      barcode = item['codigoBarras2nd'] || '';
    }

    if (!barcode || barcode.trim().length === 0) {
      this.snackBar.open('No hay código de barras para buscar el producto', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'right'
      });
      return;
    }

    const key = `${conflictoIndex}-${itemIndex}`;
    this.verificandoProducto[key] = true;

    // Buscar el producto por código de barras - SOLO cuando se hace clic en Editar
    this.relationalProductService.searchByBarcode(barcode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (producto) => {
        this.verificandoProducto[key] = false;
        
        if (!producto || !producto.id) {
          // Si no existe, mostrar mensaje y permitir registrar
          this.snackBar.open('El producto no existe. Puede registrarlo usando el botón Registrar.', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'right'
          });
          this.productosExistentes[key] = false;
          return;
        }

        // Marcar como existente y abrir el modal de edición
        this.productosExistentes[key] = true;
        
        // Abrir el modal de edición con los datos del producto
        const dialogRef = this.dialog.open(ProductEditComponent, {
          width: '600px',
          data: {
            id: producto.id,
            nombre: producto.nombre,
            barcode: producto.barcode,
            precio: producto.precio,
            precioCompra: producto.precioCompra || 0,
            foto: producto.foto || '',
            company: producto.company
          }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result && result._edit) {
            // Producto fue actualizado, recargar conflictos
            if (this.selectedCargueProductoId) {
              this.loadConflictos(this.selectedCargueProductoId);
            }
          }
        });
      },
      error: (err) => {
        console.error('Error al buscar producto', err);
        this.verificandoProducto[key] = false;
        this.productosExistentes[key] = false;
        
        // Si es 404, el producto no existe
        if (err.status === 404) {
          this.snackBar.open('El producto no existe. Puede registrarlo usando el botón Registrar.', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'right'
          });
        } else {
          this.snackBar.open(
            'Error al buscar el producto. Por favor intente nuevamente.',
            'Cerrar',
            {
              duration: 5000,
              horizontalPosition: 'right',
              panelClass: ['error-snackbar']
            }
          );
        }
      }
    });
  }

  buscarCodigoBarrasEnGoogle(conflictoIndex: number, itemIndex: number): void {
    const conflictoParsed = this.conflictosParsed[conflictoIndex];
    if (!conflictoParsed || !conflictoParsed.items[itemIndex]) {
      return;
    }

    const item = conflictoParsed.items[itemIndex];
    let codigoBarras = '';

    if (itemIndex === 0) {
      codigoBarras = item.codigoBarras || '';
    } else {
      codigoBarras = item['codigoBarras2nd'] || '';
    }

    if (!codigoBarras || codigoBarras.trim().length === 0) {
      this.snackBar.open('No hay código de barras para buscar', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'right'
      });
      return;
    }

    // Validar que sea un código de barras válido (solo números, típicamente 8, 12 o 13 dígitos)
    const codigoLimpio = codigoBarras.trim();
    const esCodigoValido = /^\d{8,13}$/.test(codigoLimpio);

    if (!esCodigoValido) {
      this.snackBar.open('El código de barras no tiene un formato válido', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'right',
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Abrir Google con la búsqueda del código de barras
    const url = `https://www.google.com/search?q=${encodeURIComponent(codigoBarras)}`;
    window.open(url, '_blank');
  }

  abrirModalRegistrarCargue(): void {
    const dialogRef = this.dialog.open(CargueProductoModalComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result?: CargueProductoDto) => {
      if (result) {
        // Recargar la lista de cargues después de registrar uno nuevo
        this.loadCargueProductos();
      }
    });
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      // Si ya está ordenado por esta columna, invertir la dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna, ordenar ascendente por defecto
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  applySort(): void {
    if (!this.sortColumn) {
      return;
    }

    this.conflictosParsed.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'tipo':
          valueA = this.getTipoConflictoLabel(a.conflicto.tipoConflictoId);
          valueB = this.getTipoConflictoLabel(b.conflicto.tipoConflictoId);
          break;
        case 'producto':
          valueA = this.getNombreProductoFormateado(a).replace(/<br>/g, ' ').toLowerCase();
          valueB = this.getNombreProductoFormateado(b).replace(/<br>/g, ' ').toLowerCase();
          break;
        case 'datos':
          valueA = this.formatDatosConflicto(a.conflicto.datosConflicto).toLowerCase();
          valueB = this.formatDatosConflicto(b.conflicto.datosConflicto).toLowerCase();
          break;
        default:
          return 0;
      }

      // Comparación alfabética
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'mat:unfold_more';
    }
    return this.sortDirection === 'asc' ? 'mat:arrow_upward' : 'mat:arrow_downward';
  }

  isSortedBy(column: string): boolean {
    return this.sortColumn === column;
  }
}

