import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgFor, NgIf } from '@angular/common';
import { RelationalProductService } from '../service/relational-product.service';
import { Producto } from '../model/producto';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';

@Component({
  selector: 'vex-product-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    NgIf,
    NgFor,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss'
})
export class ProductEditComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('nombreInput') nombreInput!: ElementRef<HTMLInputElement>;
  @ViewChild('precioInput') precioInput!: ElementRef<HTMLInputElement>;
  @ViewChild('buyPriceInput') buyPriceInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private relationalProductService: RelationalProductService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      barcode: [''],
      precio: ['', Validators.required],
      buy_price: ['']
    });
    if (data) {
      const patchValue: any = {};
      
      // Handle barcode - can come directly from data.barcode or from data.reference.barcode
      let barcodeValue = data.barcode || data?.reference?.barcode;
      if (barcodeValue) {
        barcodeValue = String(barcodeValue).trim();
      }
      
      // For NEW products: if barcode is not numeric, move it to nombre and clear barcode
      const isNewProduct = !data.id;
      if (isNewProduct && barcodeValue && barcodeValue.length > 0 && !this.isNumericBarcode(barcodeValue)) {
        // Move non-numeric barcode to nombre (uppercase it)
        patchValue.nombre = barcodeValue.toUpperCase();
        patchValue.barcode = ''; // Clear barcode
        // Mark that we moved barcode to nombre (for focus management)
        (this.form as any)._barcodeMovedToNombre = true;
      } else {
        // Normal flow: set fields from data
        if (data.nombre !== undefined) {
          patchValue.nombre = data.nombre;
        }
        if (barcodeValue !== undefined && barcodeValue !== null && barcodeValue !== '') {
          patchValue.barcode = barcodeValue;
        }
      }
      
      if (data.precio !== undefined || data.price !== undefined) {
        patchValue.precio = data.precio || data.price;
      }
      
      if (data.precioCompra !== undefined || data.buy_price !== undefined) {
        patchValue.buy_price = data.precioCompra || data.buy_price;
      }
      
      // Apply all patches at once
      if (Object.keys(patchValue).length > 0) {
        this.form.patchValue(patchValue);
      }
    }
  }

  ngOnInit() {
    // Component initialization
  }

  ngAfterViewInit() {
    // Focus management: wait for Material dialog to fully initialize
    // Using afterOpened ensures all ARIA attributes and focus trap are ready
    this.dialogRef.afterOpened().subscribe(() => {
      // Use requestAnimationFrame to ensure DOM is ready after dialog animation
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.setInitialFocus();
          // Configurar el arrastre del diálogo
          this.setupDrag();
        }, 50);
      });
    });
  }

  private setupDrag() {
    // Obtener el elemento del overlay del diálogo
    const overlayElement = document.querySelector('.cdk-overlay-pane');
    if (overlayElement) {
      // Hacer que el overlay sea arrastrable
      (overlayElement as HTMLElement).style.position = 'relative';
    }
  }

  private isNumericBarcode(value: string): boolean {
    // Check if the value is a numeric barcode (all digits, typically 8-13 digits)
    if (!value || value.trim() === '') return false;
    return /^\d{8,}$/.test(value.trim());
  }

  private setInitialFocus() {
    // Focus on first empty field, respecting Material's focus trap
    try {
      const barcodeValue = this.form.controls['barcode'].value;
      const nombreValue = this.form.controls['nombre'].value;
      const precioValue = this.form.controls['precio'].value;
      
      // Check if barcode was moved to nombre (for new products with non-numeric barcode)
      const barcodeMovedToNombre = (this.form as any)._barcodeMovedToNombre;
      
      // Check if all fields are filled (editing existing product)
      const allFieldsFilled = barcodeValue && nombreValue && precioValue !== null && precioValue !== undefined && precioValue !== '';
      
      // Priority 1: If barcode was moved to nombre, focus on precio
      if (barcodeMovedToNombre && nombreValue && !precioValue) {
        if (this.precioInput?.nativeElement) {
          this.precioInput.nativeElement.focus({ preventScroll: true });
          this.precioInput.nativeElement.select();
        }
        return; // Exit early to prevent other focus logic
      }
      
      // Priority 2: All fields filled (editing existing product)
      if (allFieldsFilled && this.precioInput?.nativeElement) {
        this.precioInput.nativeElement.focus({ preventScroll: true });
        this.precioInput.nativeElement.select();
        return;
      }
      
      // Priority 3: Barcode is empty and wasn't moved - focus on it (only if nombre is also empty)
      if (!barcodeValue && !barcodeMovedToNombre && !nombreValue && this.barcodeInput?.nativeElement) {
        this.barcodeInput.nativeElement.focus({ preventScroll: true });
        return;
      }
      
      // Priority 4: Barcode has value - check if numeric
      if (barcodeValue) {
        if (this.isNumericBarcode(barcodeValue)) {
          // Numeric barcode - focus on next empty field
          if (!nombreValue && this.nombreInput?.nativeElement) {
            this.nombreInput.nativeElement.focus({ preventScroll: true });
          } else if (!precioValue && precioValue !== 0 && this.precioInput?.nativeElement) {
            this.precioInput.nativeElement.focus({ preventScroll: true });
            this.precioInput.nativeElement.select();
          }
          return;
        }
        // Non-numeric barcode should have been moved (for new products)
        // If it still exists, focus on precio (fallback)
        if (this.precioInput?.nativeElement) {
          this.precioInput.nativeElement.focus({ preventScroll: true });
          this.precioInput.nativeElement.select();
        }
        return;
      }
      
      // Priority 5: Nombre is empty and barcode is handled
      if (!nombreValue && this.nombreInput?.nativeElement) {
        this.nombreInput.nativeElement.focus({ preventScroll: true });
        return;
      }
      
      // Priority 6: Focus on precio if everything else is filled
      if (this.precioInput?.nativeElement) {
        this.precioInput.nativeElement.focus({ preventScroll: true });
        this.precioInput.nativeElement.select();
      }
    } catch (e) {
      // Silently fail if focus cannot be set (e.g., if element is not in the DOM)
      console.debug('Focus management skipped:', e);
    }
  }

  onPrecioFocus() {
    // Select all text when precio input receives focus
    if (this.precioInput?.nativeElement) {
      setTimeout(() => {
        this.precioInput.nativeElement.select();
      }, 0);
    }
  }

  onBuyPriceFocus() {
    // Select all text when buy_price input receives focus
    if (this.buyPriceInput?.nativeElement) {
      setTimeout(() => {
        this.buyPriceInput.nativeElement.select();
      }, 0);
    }
  }

  onBarcodeFocus() {
    // Select all text in barcode field if it's not a numeric barcode
    const barcodeValue = this.form.controls['barcode'].value;
    if (this.barcodeInput?.nativeElement && barcodeValue && !this.isNumericBarcode(barcodeValue)) {
      setTimeout(() => {
        this.barcodeInput.nativeElement.select();
      }, 0);
    }
  }

  get isEditMode(): boolean {
    // Verificar si hay ID y no es 0
    return !!(this.data && this.data.id && this.data.id !== 0);
  }

  get buttonLabel(): string {
    return this.isEditMode ? 'Actualizar producto' : 'Registrar producto';
  }

  save() {
    if (this.form.invalid) return;
    const form = this.form.value;
    const product: Producto = {
      nombre: form.nombre,
      barcode: form.barcode,
      precio: form.precio,
      precioCompra: form.buy_price || undefined,
      foto: this.data?.foto || '',
      company: this.data?.company
    };
    if (this.isEditMode) {
      // Edit mode
      const productId = typeof this.data.id === 'string' ? parseInt(this.data.id) : this.data.id;
      this.relationalProductService.updateProduct(productId, product).subscribe({
        next: (result) => this.dialogRef.close({ ...result, _edit: true }),
        error: (err) => alert('Error al actualizar el producto: ' + (err?.error?.message || err.message || err))
      });
    } else {
      // Add mode
      this.relationalProductService.createProduct(product).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => alert('Error al guardar el producto: ' + (err?.error?.message || err.message || err))
      });
    }
  }
}
