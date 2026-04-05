import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ProveedorService, ProveedorDto, CreateProveedorRequest, isUuidDocumento } from '../service/proveedor.service';
import { TipoEgresoService, TipoEgresoDto } from '../../egresos/service/tipo-egreso.service';

export interface ProveedorErrorItem {
  descripcionError: string;
  campo: string;
}

@Component({
  selector: 'vex-proveedor-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    NgIf,
    NgFor,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatAutocompleteModule,
    AsyncPipe,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './proveedor-edit.component.html',
  styleUrl: './proveedor-edit.component.scss'
})
export class ProveedorEditComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  errores: ProveedorErrorItem[] = [];
  tiposEgreso: TipoEgresoDto[] = [];
  filteredTipos$!: Observable<TipoEgresoDto[]>;
  /** UUID original cuando documento viene del backend como UUID (para preservar en update) */
  private originalDocumentoUuid: string | null = null;
  @ViewChild('nombreInput') nombreInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tipoEgresoInput') tipoEgresoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentoInput') documentoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('telefonoInput') telefonoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('correoInput') correoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProveedorEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProveedorDto | { initialNombre?: string } | null,
    private proveedorService: ProveedorService,
    private tipoEgresoService: TipoEgresoService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      documento: [''],
      telefono: [''],
      correo: [''],
      tipoEgreso: [null as TipoEgresoDto | null, Validators.required]
    });

    const dataObj = data as ProveedorDto | { initialNombre?: string } | null;
    if (dataObj && typeof dataObj === 'object' && 'id' in dataObj && (dataObj as ProveedorDto).id) {
      const d = dataObj as ProveedorDto;
      const docValue = d.documento || '';
      if (isUuidDocumento(docValue)) {
        this.originalDocumentoUuid = docValue;
        this.form.patchValue({
          nombre: d.nombre,
          documento: '(Autogenerado)',
          telefono: d.telefono || '',
          correo: d.correo || '',
          tipoEgreso: d.tipoEgreso ? { id: d.tipoEgreso.id, nombre: d.tipoEgreso.nombre, descripcion: d.tipoEgreso.descripcion } : null
        });
      } else {
        this.form.patchValue({
          nombre: d.nombre,
          documento: docValue,
          telefono: d.telefono || '',
          correo: d.correo || '',
          tipoEgreso: d.tipoEgreso ? { id: d.tipoEgreso.id, nombre: d.tipoEgreso.nombre, descripcion: d.tipoEgreso.descripcion } : null
        });
      }
    } else if (dataObj && typeof dataObj === 'object' && 'initialNombre' in dataObj && (dataObj as { initialNombre?: string }).initialNombre) {
      this.form.patchValue({
        nombre: (dataObj as { initialNombre: string }).initialNombre.trim()
      });
    }
  }

  ngOnInit() {
    this.loadTiposEgreso();
    this.filteredTipos$ = this.form.get('tipoEgreso')!.valueChanges.pipe(
      startWith(this.form.get('tipoEgreso')!.value),
      map((value) => this.filterTipos(value))
    );
  }

  private loadTiposEgreso() {
    this.tipoEgresoService.getTiposEgreso().subscribe({
      next: (tipos) => {
        this.tiposEgreso = tipos;
        this.patchTipoEgresoAfterLoad();
      }
    });
  }

  private patchTipoEgresoAfterLoad() {
    const dataObj = this.data as ProveedorDto | null;
    if (!dataObj || typeof dataObj !== 'object' || !('id' in dataObj)) return;
    const d = dataObj as ProveedorDto;
    const tipo = this.tiposEgreso.find(t => t.id === d.tipoEgreso?.id);
    if (tipo) this.form.patchValue({ tipoEgreso: tipo }, { emitEvent: false });
  }

  private filterTipos(value: TipoEgresoDto | string | null): TipoEgresoDto[] {
    if (typeof value === 'object' && value !== null) return [...this.tiposEgreso];
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : '';
    if (!filterValue) return [...this.tiposEgreso];
    return this.tiposEgreso.filter(t =>
      t.nombre.toLowerCase().includes(filterValue) ||
      (t.descripcion && t.descripcion.toLowerCase().includes(filterValue))
    );
  }

  displayTipoEgreso(tipo: TipoEgresoDto | null): string {
    return tipo ? tipo.nombre : '';
  }

  ngAfterViewInit() {
    this.dialogRef.afterOpened().subscribe(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.setInitialFocus();
          this.setupDrag();
        }, 50);
      });
    });
  }

  private setupDrag() {
    const overlayElement = document.querySelector('.cdk-overlay-pane');
    if (overlayElement) {
      (overlayElement as HTMLElement).style.position = 'relative';
    }
  }

  private setInitialFocus() {
    try {
      const nombreValue = this.form.controls['nombre'].value;
      const tipoEgresoValue = this.form.controls['tipoEgreso'].value;
      const documentoValue = this.form.controls['documento'].value;
      const telefonoValue = this.form.controls['telefono'].value;

      if ((nombreValue === null || nombreValue === '' || (typeof nombreValue === 'string' && !nombreValue.trim())) && this.nombreInput?.nativeElement) {
        this.nombreInput.nativeElement.focus({ preventScroll: true });
        return;
      }

      if (!tipoEgresoValue && this.tipoEgresoInput?.nativeElement) {
        this.tipoEgresoInput.nativeElement.focus({ preventScroll: true });
        return;
      }

      if (!documentoValue && this.documentoInput?.nativeElement) {
        this.documentoInput.nativeElement.focus({ preventScroll: true });
        return;
      }

      if (!telefonoValue && this.telefonoInput?.nativeElement) {
        this.telefonoInput.nativeElement.focus({ preventScroll: true });
        return;
      }

      if (this.correoInput?.nativeElement) {
        this.correoInput.nativeElement.focus({ preventScroll: true });
      }
    } catch (e) {
      console.debug('Focus management skipped:', e);
    }
  }

  onTelefonoFocus() {
    if (this.telefonoInput?.nativeElement) {
      setTimeout(() => {
        this.telefonoInput.nativeElement.select();
      }, 0);
    }
  }

  onDocumentoFocus() {
    if (this.documentoInput?.nativeElement) {
      setTimeout(() => {
        this.documentoInput.nativeElement.select();
      }, 0);
    }
  }

  onCorreoFocus() {
    if (this.correoInput?.nativeElement) {
      setTimeout(() => {
        this.correoInput.nativeElement.select();
      }, 0);
    }
  }

  get isEditMode(): boolean {
    const d = this.data as ProveedorDto | { initialNombre?: string } | null;
    return !!(d && typeof d === 'object' && 'id' in d && (d as ProveedorDto).id && (d as ProveedorDto).id !== 0);
  }

  get buttonLabel(): string {
    return this.isEditMode ? 'Actualizar proveedor' : 'Registrar proveedor';
  }

  getErrorForCampo(campo: string): string | undefined {
    const item = this.errores.find(e => e.campo === campo);
    return item?.descripcionError;
  }

  save() {
    if (this.form.invalid) return;

    this.errores = [];
    const form = this.form.value;
    let documentoToSend = form.documento || '';
    if (documentoToSend === '(Autogenerado)') {
      documentoToSend = this.originalDocumentoUuid ?? '';
    }
    const tipo = form.tipoEgreso as TipoEgresoDto;
    const proveedorRequest: CreateProveedorRequest = {
      nombre: form.nombre,
      documento: documentoToSend,
      telefono: form.telefono || '',
      correo: form.correo || '',
      tipoEgreso: tipo ? { id: tipo.id } : undefined
    };

    if (this.isEditMode && this.data && 'id' in this.data) {
      const proveedorId = (this.data as ProveedorDto).id;
      this.proveedorService.updateProveedor(proveedorId, proveedorRequest).subscribe({
        next: (result) => this.dialogRef.close({ ...result, _edit: true }),
        error: (err) => this.handleError(err)
      });
    } else {
      this.proveedorService.createProveedor(proveedorRequest).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleError(err: { error?: { errores?: ProveedorErrorItem[]; message?: string }; message?: string }) {
    const errores = err?.error?.errores;
    if (Array.isArray(errores) && errores.length > 0) {
      this.errores = errores;
    } else {
      this.errores = [{
        campo: '_general',
        descripcionError: err?.error?.message ?? err?.message ?? 'Error al procesar la solicitud'
      }];
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
