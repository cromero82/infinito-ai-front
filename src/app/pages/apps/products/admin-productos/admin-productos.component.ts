import { Component } from '@angular/core';
import { ProductListComponent } from '../product-list/product-list.component';

@Component({
  selector: 'vex-admin-productos',
  standalone: true,
  imports: [ProductListComponent],
  templateUrl: './admin-productos.component.html',
  styleUrl: './admin-productos.component.scss'
})
export class AdminProductosComponent {}
