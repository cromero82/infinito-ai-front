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
  loadingMore = false;
  error: string | null = null;
  displayedColumns = ['nombre', 'barcode', 'precio', 'acciones'];
  page = 0;
  size = 20;
  totalPages = 0;
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
      this.fetchProducts(this.data.term, true);
    }

    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        const term = value?.trim();
        if (!term) {
          this.products = [];
          this.error = null;
          this.page = 0;
          this.totalPages = 0;
          return;
        }
        this.fetchProducts(term, true);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        const input = this.searchInput.nativeElement;
        input.focus();
        // Move cursor to end instead of selecting all text
        const length = input.value.length;
        input.setSelectionRange(length, length);
      }
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

  clearSearch(): void {
    this.searchCtrl.setValue('');
    this.products = [];
    this.error = null;
    this.page = 0;
    this.totalPages = 0;
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
          this.fetchProducts(currentTerm, true);
        }
      }
    });
  }

  private fetchProducts(term: string, reset: boolean): void {
    if (reset) {
      this.page = 0;
      this.totalPages = 0;
      this.products = [];
      this.loading = true;
      this.loadingMore = false;
    } else {
      if (this.loading || this.loadingMore) {
        return;
      }
      this.loadingMore = true;
    }

    this.error = null;
    const pageToLoad = reset ? 0 : this.page + 1;

    this.relationalProductService.getProducts(term, pageToLoad, this.size).subscribe({
      next: (resp: ProductPage) => {
        const content = resp?.content ?? [];
        this.totalPages = resp?.totalPages ?? 0;
        this.page = pageToLoad;

        if (reset) {
          this.products = content;
        } else {
          this.products = this.products.concat(content);
        }

        if (this.products.length === 0) {
          this.error = 'No se encontraron productos.';
        }
        this.loading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        if (reset) {
          this.products = [];
          this.error = 'Error al cargar productos.';
        }
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (!element) {
      return;
    }

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const remaining = scrollHeight - (scrollTop + clientHeight);

    const isNearBottom = remaining < 80;

    const currentTerm = this.searchCtrl.value?.trim();
    if (
      isNearBottom &&
      !this.loading &&
      !this.loadingMore &&
      currentTerm &&
      (this.totalPages === 0 || this.page + 1 < this.totalPages)
    ) {
      this.fetchProducts(currentTerm, false);
    }
  }
}


