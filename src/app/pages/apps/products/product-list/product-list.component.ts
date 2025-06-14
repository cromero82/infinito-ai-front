import { Component, OnInit, ViewChild } from '@angular/core';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexBreadcrumbsComponent } from '@vex/components/vex-breadcrumbs/vex-breadcrumbs.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { ProductsService } from '../service/products-service';
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
export class ProductListComponent implements OnInit {
  displayedColumns: string[] = ['barcode', 'nombre', 'precio', 'foto'];
  dataSource: any[] = [];
  totalElements = 0;
  loading = false;
  pageSize = 10;
  pageIndex = 0;
  searchCtrl = new UntypedFormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private productsService: ProductsService, private http: HttpClient) {}

  ngOnInit() {
    this.fetchProducts();
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.pageIndex = 0;
        this.fetchProducts();
      });
  }

  fetchProducts(page: number = this.pageIndex, size: number = this.pageSize) {
    this.loading = true;
    let barcode = this.searchCtrl.value || '';
    barcode = barcode.toUpperCase();
    this.productsService
      .obtenerProductos(barcode, page, size)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((result: ProductPage) => {
        this.dataSource = result.content;
        this.totalElements = result.totalElements;
      });
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.fetchProducts();
  }

  createProduct() {
    // Aquí puedes agregar la lógica para crear un producto en el futuro
  }
}
