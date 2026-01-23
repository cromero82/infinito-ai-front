import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexBreadcrumbsComponent } from '@vex/components/vex-breadcrumbs/vex-breadcrumbs.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { RelationalProductService } from '../service/relational-product.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { Producto, ProductPage } from '../model/producto';
import { finalize } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { UntypedFormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as RecordRTC from 'recordrtc';
import { MatDialog } from '@angular/material/dialog';
import { ProductEditComponent } from '../product-edit/product-edit.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'vex-product-list',
  standalone: true,
  imports: [
    VexPageLayoutComponent,
    VexPageLayoutHeaderDirective,
    VexPageLayoutContentDirective,
    VexBreadcrumbsComponent,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    FormsModule,
    NgFor,
    NgIf,
    DecimalPipe
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'id', 'nombre', 'price', 'edit'
  ];
  dataSource: any[] = [];
  totalElements = 0;
  loading = false;
  pageSize = 10;
  pageIndex = 0;
  searchCtrl = new UntypedFormControl('');
  private justClosedDialog = false; // Flag to prevent auto-edit after dialog closes
  selectedProductId: number | null = null; // Track selected product ID

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  recording = false;
  private recorder: any = null;
  private stream: MediaStream | null = null;

  constructor(private relationalProductService: RelationalProductService, private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit() {
    this.fetchProducts();
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        // Reset flag when user types in search (allows auto-edit)
        this.justClosedDialog = false;
        this.pageIndex = 0;
        this.fetchProducts(true);
      });
  }

  ngAfterViewInit() {
    // Focus on search input when component loads
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Handle keyboard events for "-" key to delete selected product
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Check for minus key (support both regular minus and numeric keypad minus)
    const isMinusKey = event.key === '-' || 
                       event.key === 'Minus' || 
                       event.code === 'Minus' || 
                       event.code === 'NumpadSubtract';
    
    // Only handle "-" key if a product is selected and not typing in an input
    if (isMinusKey && this.selectedProductId !== null) {
      const target = event.target as HTMLElement;
      // Don't delete if user is typing in search input or other inputs
      if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        // Additional check: don't delete if the input is focused
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.deleteSelectedProduct();
      }
    }
  }

  /**
   * Handle row click to select/deselect product
   */
  onRowClick(product: Producto) {
    if (this.selectedProductId === product.id) {
      // Deselect if clicking the same row
      this.selectedProductId = null;
    } else {
      // Select new row
      this.selectedProductId = product.id || null;
    }
  }

  /**
   * Check if a product row is selected
   */
  isRowSelected(product: Producto): boolean {
    return this.selectedProductId === product.id;
  }

  /**
   * Delete the selected product
   */
  deleteSelectedProduct() {
    if (this.selectedProductId === null) {
      return;
    }

    const productId = this.selectedProductId;
    if (confirm(`¿Está seguro de que desea eliminar el producto con ID ${productId}?`)) {
      this.loading = true;
      this.relationalProductService.deleteProduct(productId)
        .pipe(finalize(() => {
          this.loading = false;
          this.selectedProductId = null; // Clear selection after deletion
        }))
        .subscribe({
          next: () => {
            // Refresh the product list
            this.fetchProducts();
            // Focus back on search input
            this.focusSearchInput();
          },
          error: (err) => {
            alert('Error al eliminar el producto: ' + (err?.error?.message || err.message || err));
            this.focusSearchInput();
          }
        });
    }
  }

  private isNumericBarcode(value: string): boolean {
    // Check if the value is a numeric barcode (all digits, typically 8-13 digits)
    if (!value || value.trim() === '') return false;
    return /^\d{8,}$/.test(value.trim());
  }

  fetchProducts(shouldAutoEdit: boolean = false, page: number = this.pageIndex, size: number = this.pageSize) {
    this.loading = true;
    let q = this.searchCtrl.value || '';
    this.relationalProductService
      .getProducts(q, page, size)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((result: ProductPage) => {
        this.dataSource = result.content;
        this.totalElements = result.totalElements;
        
        // Auto-open edit dialog only if:
        // 1. shouldAutoEdit is true (user typed in search)
        // 2. Exactly 1 product found
        // 3. We didn't just close a dialog (prevents auto-edit after dialog close)
        if (shouldAutoEdit && !this.justClosedDialog && result.totalElements === 1 && result.content.length > 0) {
          this.editProduct(result.content[0]);
        }
        
        // Auto-open create product dialog only if:
        // 1. No products found
        // 2. Search text is a barcode
        // 3. We didn't just close a dialog (prevents auto-create after dialog close)
        if (result.totalElements === 0 && !this.justClosedDialog) {
          const searchQuery = q.trim();
          // Only create product if the search query is a numeric barcode
          if (searchQuery && this.isNumericBarcode(searchQuery)) {
            this.createProduct(searchQuery);
          }
        }
      });
  }

  createProduct(barcode?: string) {
    // Only pass barcode if it has a value (trim and check)
    const trimmedBarcode = barcode?.trim();
    const dialogData = trimmedBarcode ? { barcode: trimmedBarcode } : null;
    const dialogRef = this.dialog.open(ProductEditComponent, {
      width: '600px',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      // Set flag to prevent auto-edit after dialog closes
      this.justClosedDialog = true;
      if (result) {
        // Set searchCtrl to the barcode of the created product
        if (result.barcode) {
          this.searchCtrl.setValue(result.barcode);
        }
        this.fetchProducts(); // This won't auto-edit because justClosedDialog is true
      }
      // Always focus on search input when dialog closes (cancelled or saved)
      this.focusSearchInput();
    });
  }

  editProduct(product?: any) {
    const dialogRef = this.dialog.open(ProductEditComponent, {
      width: '600px',
      data: product
    });
    dialogRef.afterClosed().subscribe(result => {
      // Set flag to prevent auto-edit after dialog closes
      this.justClosedDialog = true;
      if (result && result._edit) {
        this.fetchProducts(); // This won't auto-edit because justClosedDialog is true
      }
      // Always focus on search input when dialog closes (cancelled or saved)
      this.focusSearchInput();
    });
  }

  private focusSearchInput() {
    // Always focus on search input when dialog closes
    if (this.searchInput?.nativeElement) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
        // If there's text, select all
        if (this.searchCtrl.value) {
          this.searchInput.nativeElement.select();
        }
      }, 100);
    }
  }

  /**
   * Check if a product is active
   */
  isProductActive(product: Producto): boolean {
    return product.activate === 1 || product.activate === undefined;
  }

  /**
   * Toggle product activation/deactivation
   */
  toggleProductActivation(product: Producto) {
    const productId = product.id;
    if (!productId) {
      return;
    }

    const isCurrentlyActive = this.isProductActive(product);
    const shouldActivate = !isCurrentlyActive;
    
    // Si se va a deshabilitar, mostrar diálogo de confirmación
    if (!shouldActivate) {
      const dialogData: ConfirmDialogData = {
        titulo: 'Confirmar deshabilitación',
        mensaje: `¿Estás seguro de que deseas deshabilitar el producto ${product.nombre}?`
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: dialogData
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.executeActivationChange(product, productId, shouldActivate);
        }
      });
    } else {
      // Si se va a activar, ejecutar directamente sin confirmación
      this.executeActivationChange(product, productId, shouldActivate);
    }
  }

  /**
   * Execute the activation/deactivation service call
   */
  private executeActivationChange(product: Producto, productId: number, shouldActivate: boolean) {
    this.loading = true;

    const operation = shouldActivate 
      ? this.relationalProductService.activateProduct(productId)
      : this.relationalProductService.deactivateProduct(productId);

    operation
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: (updatedProduct) => {
          // Refresh the product list to update the search
          this.fetchProducts();
        },
        error: (err) => {
          alert('Error al ' + (shouldActivate ? 'activar' : 'desactivar') + ' el producto: ' + (err?.error?.message || err.message || err));
        }
      });
  }

}
