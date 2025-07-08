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
export class ProductListComponent implements OnInit {
  displayedColumns: string[] = [
    'id', 'nombre', 'tipo', 'price', 'photo', 'edit'
  ];
  dataSource: any[] = [];
  totalElements = 0;
  loading = false;
  pageSize = 10;
  pageIndex = 0;
  searchCtrl = new UntypedFormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  recording = false;
  private recorder: any = null;
  private stream: MediaStream | null = null;

  constructor(private productsService: ProductsService, private http: HttpClient, private dialog: MatDialog) {}

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
    let q = this.searchCtrl.value || '';
    this.productsService
      .getProductsSmart(q, page, size)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((result: any) => {
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
    const dialogRef = this.dialog.open(ProductEditComponent, {
      width: '600px',
      data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchProducts();
      }
    });
  }

  editProduct(product: any) {
    const dialogRef = this.dialog.open(ProductEditComponent, {
      width: '600px',
      data: product
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result._edit) {
        this.fetchProducts();
      }
    });
  }

  async toggleRecording() {
    if (this.recording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = new RecordRTC(this.stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
      });
      this.recorder.startRecording();
      this.recording = true;
    } catch (err) {
      console.error('No se pudo acceder al micrófono:', err);
    }
  }

  async stopRecording() {
    if (this.recorder && this.recording) {
      await new Promise(resolve => this.recorder.stopRecording(resolve));
      const audioBlob = this.recorder.getBlob();
      this.recording = false;
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      this.sendAudioForTranscription(audioBlob);
    }
  } 

  sendAudioForTranscription(audioBlob: Blob) {
    this.productsService.speechToText(audioBlob).subscribe({
      next: (result) => {
        if (result && result.text) {
          this.searchCtrl.setValue(result.text);
        }
      },
      error: (err) => {
        console.error('Error en transcripción de audio:', err);
      }
    });
  }

}
