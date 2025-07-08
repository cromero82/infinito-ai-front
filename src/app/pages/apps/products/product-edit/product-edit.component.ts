import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { DomainService } from '../service/domain-service';
import { ProductsService } from '../service/products-service';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AudioRecorderService } from '../service/audio-recorder.service';
import { FilterTypePipe, FilterCompanyPipe } from './filter-pipes';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';
import { NgClass } from '@angular/common';

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
    MatAutocompleteModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    AsyncPipe,
    FilterTypePipe,
    FilterCompanyPipe,
    NgClass
  ],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss'
})
export class ProductEditComponent implements OnInit {
  form: FormGroup;
  types: any[] = [];
  companies: any[] = [];
  recording = false;
  typeFilter: string = '';
  companyFilter: string = '';
  typeInput: string = '';
  companyInput: string = '';
  filteredTypes$: Observable<any[]> = new Observable<any[]>();
  filteredCompanies$: Observable<any[]> = new Observable<any[]>();
  typeCtrl = new FormControl('');
  companyCtrl = new FormControl('');
  photoPreviewUrl: string = 'assets/img/icons/custom/no_picture.png';
  private photoFile: File | null = null;
  productExternalInfo: any = null;
  showImageModal = false;

  constructor(
    private fb: FormBuilder,
    private domainService: DomainService,
    private dialogRef: MatDialogRef<ProductEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private productsService: ProductsService,
    private audioRecorder: AudioRecorderService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      barcode: [''],
      price: ['', Validators.required],
      type: [''],
      company_id: ['']
    });
    if (data) {
      this.form.patchValue({
        nombre: data.nombre,
        barcode: data.reference?.barcode || '',
        price: data.price,
        type: data.type,
        company_id: data.reference?.company_id
      });
    }
  }

  ngOnInit() {
    this.domainService.getTypes().subscribe(types => {
      this.types = types;
      // Set initial value for type
      const initialType = this.form.controls['type'].value || '';
      this.typeCtrl.setValue(initialType);
      this.filteredTypes$ = this.typeCtrl.valueChanges.pipe(
        startWith(initialType),
        map(val => typeof val === 'string' ? this.types.filter(t => t.name.toLowerCase().includes(val.toLowerCase())) : this.types)
      );
    });
    this.domainService.getCompanies().subscribe(companies => {
      this.companies = companies;
      // Set initial value for company
      const initialCompanyId = this.form.controls['company_id'].value;
      const initialCompany = companies.find(c => c.id === initialCompanyId)?.name || '';
      this.companyCtrl.setValue(initialCompany);
      this.filteredCompanies$ = this.companyCtrl.valueChanges.pipe(
        startWith(initialCompany),
        map(val => typeof val === 'string' ? this.companies.filter(c => c.name.toLowerCase().includes(val.toLowerCase())) : this.companies)
      );
    });
    this.audioRecorder.recording$.subscribe(blob => this.sendAudioForTranscription(blob));

    // Patch initial values for autocomplete fields
    if (this.data) {
      this.typeInput = this.form.controls['type'].value || '';
      const company = this.companies.find(c => c.id === this.form.controls['company_id'].value);
      this.companyInput = company ? company.name : '';
    }
    // Set initial photo preview
    const photo = this.data?.photo;
    if (photo && photo !== 'undefined' && photo !== null) {
      this.photoPreviewUrl = photo;
    }
  }

  save() {
    if (this.form.invalid) return;
    const form = this.form.value;
    const product = {
      nombre: form.nombre,
      reference: {
        barcode: form.barcode,
        company_id: form.company_id,
        marca: null
      },
      type: form.type,
      price: form.price,
      photo: 'undefined'
    };
    const handleImageUpload = (productId: string, closeResult: any) => {
      if (this.photoFile) {
        this.productsService.uploadProductImage(productId, this.photoFile, this.photoFile.name).subscribe({
          next: () => this.dialogRef.close(closeResult),
          error: (err) => {
            alert('Producto guardado, pero error al subir la imagen: ' + (err?.error?.message || err.message || err));
            this.dialogRef.close(closeResult);
          }
        });
      } else {
        this.dialogRef.close(closeResult);
      }
    };
    if (this.data) {
      // Edit mode
      this.productsService.modifyProduct(this.data.id, product).subscribe({
        next: (result) => handleImageUpload(this.data.id, { ...result, _edit: true }),
        error: (err) => alert('Error al actualizar el producto: ' + (err?.error?.message || err.message || err))
      });
    } else {
      // Add mode
      const newProduct = { ...product, id: form.barcode, tokens: [], features: [] };
      this.productsService.addProduct(newProduct).subscribe({
        next: (result) => handleImageUpload(result.id || form.barcode, result),
        error: (err) => alert('Error al guardar el producto: ' + (err?.error?.message || err.message || err))
      });
    }
  }

  autoSelectCompany() {
    const nombre = this.form.controls['nombre'].value?.toLowerCase() || '';
    if (!nombre || !this.companies?.length) return;
    const found = this.companies.find(c => nombre.includes((c.name || '').toLowerCase()));
    if (found) {
      this.form.controls['company_id'].setValue(found.id);
    }
  }

  async toggleRecording() {
    if (this.audioRecorder.isRecordingActive) {
      await this.audioRecorder.stopRecording();
      this.recording = false;
    } else {
      try {
        // Ensure RecordRTC is loaded
        if (!(window as any).RecordRTC) {
          const module = await import('recordrtc');
          (window as any).RecordRTC = module.default || module;
        }
        await this.audioRecorder.startRecording();
        this.recording = true;
      } catch (err) {
        this.recording = false;
        alert('No se pudo acceder al micrófono.');
      }
    }
  }

  sendAudioForTranscription(audioBlob: Blob) {
    this.productsService.speechToText(audioBlob).subscribe({
      next: (result) => {
        if (result && result.text) {
          this.form.controls['nombre'].setValue(result.text);
        }
      },
      error: (err) => {
        console.error('Error en transcripción de audio:', err);
      }
    });
  }

  onTypeSelected(event: any) {
    this.form.controls['type'].setValue(event.option.value);
    this.typeCtrl.setValue(event.option.value);
  }

  clearTypeInput() {
    this.typeCtrl.setValue('');
    this.form.controls['type'].setValue('');
  }

  onCompanySelected(event: any) {
    const found = this.companies.find(c => c.name === event.option.value);
    this.form.controls['company_id'].setValue(found ? found.id : '');
    this.companyCtrl.setValue(event.option.value);
  }

  clearCompanyInput() {
    this.companyCtrl.setValue('');
    this.form.controls['company_id'].setValue('');
  }

  clearType(typeSelect: any) {
    this.form.controls['type'].setValue('');
    setTimeout(() => typeSelect.close(), 0);
  }

  clearCompany(companySelect: any) {
    this.form.controls['company_id'].setValue('');
    setTimeout(() => companySelect.close(), 0);
  }

  onSelectImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.photoFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoPreviewUrl = e.target.result;
          this.form.patchValue({ photo: e.target.result });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  async onTakePhoto() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.autoplay = true;
      video.srcObject = stream;
      video.style.display = 'none';
      document.body.appendChild(video);
      await new Promise(resolve => video.onloadedmetadata = resolve);
      video.play();
      // Show a dialog or overlay to let user take a snapshot
      // For simplicity, take snapshot after 1 second
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        this.photoPreviewUrl = dataUrl;
        this.form.patchValue({ photo: dataUrl });
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(video);
      }, 1000);
    } catch (err) {
      alert('No se pudo acceder a la cámara.');
    }
  }

  onBarcodePasteOrInput(event: ClipboardEvent | Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value && value.length >= 8) {
      this.getProductInfoFromBarcode(value);
    }
  }

  /**
   * Checks if the type exists in the list, and adds it if not. If the backend returns a translated/modified name, set it on the typeCtrl.
   */
  ensureTypeExistsAndAddIfNeeded(typeName: string) {
    if (!typeName) return;
    const exists = this.types.some(t => t.name?.toLowerCase() === typeName.toLowerCase());
    if (!exists) {
      this.productsService.addType(typeName, 0).subscribe({
        next: (newType) => {
          this.types.push(newType);
          if (newType && newType.name && newType.name !== typeName) {
            this.typeCtrl.setValue(newType.name);
          }
        },
        error: (err) => {
          // Optionally show error
        }
      });
    }
  }

  /**
   * Checks if the company exists in the list, and adds it if not. If the backend returns a translated/modified name, set it on the companyCtrl.
   */
  ensureCompanyExistsAndAddIfNeeded(companyName: string) {
    if (!companyName) return;
    const exists = this.companies.some(c => c.name?.toLowerCase() === companyName.toLowerCase());
    if (!exists) {
      this.productsService.addCompany(companyName).subscribe({
        next: (newCompany) => {
          this.companies.push(newCompany);
          if (newCompany && newCompany.name && newCompany.name !== companyName) {
            this.companyCtrl.setValue(newCompany.name);
          }
        },
        error: (err) => {
          // Optionally show error
        }
      });
    }
  }

  // Helper to check if productExternalInfo is empty, error, or success
  get productInfoErrorOrEmpty(): string | null {
    if (this.productExternalInfo === null) return null;
    if (this.productExternalInfo === false) return 'Error consultando: open FOODS Facts';
    // Accept both { product: ... } and direct product object
    if (this.productExternalInfo.product || this.productExternalInfo.product_name_es || this.productExternalInfo.product_name) {
      return 'OK Consultando: open FOODS Facts';
    }
    return 'Ningún dato encontrado';
  }

  getProductInfoMsgClass(msg: string): string {
    if (!msg) return '';
    if (msg.startsWith('Error') || msg.startsWith('Ningún')) return 'text-red-500';
    if (msg.startsWith('Datos consultados')) return 'text-green-600';
    return '';
  }

  getProductInfoFromBarcode(barcode: string) {
    this.productsService.getProductInfo(barcode).subscribe({
      next: (result) => {
        if (result && result.product) {
          this.productExternalInfo = result.product;
          // Patch form fields with external info
          const nombre = [
            result.product.product_name_es || result.product.product_name || '',
            result.product.brands || '',
            (result.product.serving_quantity ? result.product.serving_quantity + ' ' + (result.product.serving_quantity_unit || '') : '')
          ].filter(Boolean).join(' - ');
          this.form.controls['nombre'].setValue(nombre);
          const firstCategory = (result.product.categories || '').split(',')[0]?.trim() || '';
          this.typeCtrl.setValue(firstCategory);
          this.ensureTypeExistsAndAddIfNeeded(firstCategory);
          const firstBrand = (result.product.brands || '').split(',')[0]?.trim() || '';
          this.companyCtrl.setValue(firstBrand);
          this.ensureCompanyExistsAndAddIfNeeded(firstBrand);
          if (result.product.image_url) {
            this.photoPreviewUrl = result.product.image_url;
          }
        } else {
          this.productExternalInfo = {};
        }
      },
      error: (err) => {
        this.productExternalInfo = false;
      }
    });
  }

  onImageClick() {
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
  }
}
