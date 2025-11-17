import { Component, Inject, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RelationalProductService } from '../../products/service/relational-product.service';
import { Producto, ProductPage } from '../../products/model/producto';
import { ProductEditComponent } from '../../products/product-edit/product-edit.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface ProductListSelectData {
  term: string;
}

@Component({
  selector: 'vex-product-list-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './product-list-select.component.html',
  styleUrls: ['./product-list-select.component.scss']
})
export class ProductListSelectComponent implements OnInit, AfterViewInit, OnDestroy {
  searchCtrl = new FormControl('', { nonNullable: true });
  products: Producto[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns = ['nombre', 'barcode', 'precio', 'acciones'];
  private destroy$ = new Subject<void>();
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor(
    private dialogRef: MatDialogRef<ProductListSelectComponent>,
    private relationalProductService: RelationalProductService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: ProductListSelectData
  ) {}

  ngOnInit(): void {
    if (this.data?.term) {
      this.searchCtrl.setValue(this.data.term);
      this.fetchProducts(this.data.term);
    }

    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        const term = value?.trim();
        if (!term) {
          this.products = [];
          this.error = null;
          return;
        }
        this.fetchProducts(term);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
      this.searchInput?.nativeElement.select();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectProduct(product: Producto): void {
    this.dialogRef.close(product);
  }

  close(): void {
    this.dialogRef.close();
  }

  editProduct(product: Producto, event: Event): void {
    event.stopPropagation();
    const editDialogRef = this.dialog.open(ProductEditComponent, {
      width: '600px',
      data: {
        id: product.id,
        nombre: product.nombre,
        barcode: product.barcode,
        precio: product.precio,
        precioCompra: product.precioCompra,
        foto: product.foto,
        company: (product as any).company
      },
      autoFocus: false
    });

    editDialogRef.afterClosed().subscribe((result) => {
      if (result && result._edit) {
        // Product was updated, refresh the product list
        const currentTerm = this.searchCtrl.value?.trim() || '';
        if (currentTerm) {
          this.fetchProducts(currentTerm);
        }
      }
    });
  }

  private fetchProducts(term: string): void {
    this.loading = true;
    this.error = null;
    this.relationalProductService.getProducts(term, 0, 20).subscribe({
      next: (page: ProductPage) => {
        this.products = page?.content ?? [];
        if (this.products.length === 0) {
          this.error = 'No se encontraron productos.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.products = [];
        this.error = 'Error al cargar productos.';
        this.loading = false;
      }
    });
  }
}


