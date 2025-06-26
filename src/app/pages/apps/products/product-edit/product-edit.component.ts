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
    FilterCompanyPipe
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
        barcode: data.reference?.barcode || data.id,
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
    if (this.data) {
      // Edit mode
      this.productsService.modifyProduct(this.data.id, product).subscribe({
        next: (result) => this.dialogRef.close({ ...result, _edit: true }),
        error: (err) => alert('Error al actualizar el producto: ' + (err?.error?.message || err.message || err))
      });
    } else {
      // Add mode
      const newProduct = { ...product, id: form.barcode, tokens: [], features: [] };
      this.productsService.addProduct(newProduct).subscribe({
        next: (result) => this.dialogRef.close(result),
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
}
