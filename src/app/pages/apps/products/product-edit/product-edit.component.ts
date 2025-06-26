import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgFor, NgIf } from '@angular/common';
import { DomainService } from '../service/domain-service';
import { ProductsService } from '../service/products-service';

@Component({
  selector: 'vex-product-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    NgFor,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss'
})
export class ProductEditComponent implements OnInit {
  form: FormGroup;
  types: any[] = [];
  companies: any[] = [];

  constructor(
    private fb: FormBuilder,
    private domainService: DomainService,
    private dialogRef: MatDialogRef<ProductEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private productsService: ProductsService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      barcode: ['', Validators.required],
      price: ['', Validators.required],
      type: ['', Validators.required],
      company_id: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.domainService.getTypes().subscribe(types => this.types = types);
    this.domainService.getCompanies().subscribe(companies => this.companies = companies);
  }

  save() {
    if (this.form.invalid) return;
    const form = this.form.value;
    const product = {
      id: form.barcode,
      nombre: form.nombre,
      tokens: [],
      features: [],
      reference: {
        barcode: form.barcode,
        company_id: form.company_id,
        marca: null
      },
      type: form.type,
      price: form.price,
      photo: 'undefined'
    };
    this.productsService.addProduct(product).subscribe({
      next: (result) => this.dialogRef.close(result),
      error: (err) => alert('Error al guardar el producto: ' + (err?.error?.message || err.message || err))
    });
  }
}
