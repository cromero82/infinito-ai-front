import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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

@Component({
  selector: 'vex-product-list',
  standalone: true,
  imports: [
    VexPageLayoutComponent,
    VexPageLayoutHeaderDirective,
    VexPageLayoutContentDirective,
    VexBreadcrumbsComponent,
    MatButtonModule,
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

}
