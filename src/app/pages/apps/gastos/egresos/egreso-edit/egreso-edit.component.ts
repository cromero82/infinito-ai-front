import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map, startWith, combineLatestWith } from 'rxjs/operators';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { EgresosService, EgresoDto, CreateEgresoRequest } from '../service/egresos.service';
import { ProveedorService, ProveedorDto } from '../../proveedores/service/proveedor.service';
import { ProveedorEditComponent } from '../../proveedores/proveedor-edit/proveedor-edit.component';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';

@Component({
  selector: 'gm-egreso-edit',
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
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AsyncPipe,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './egreso-edit.component.html',
  styleUrl: './egreso-edit.component.scss'
})
export class EgresoEditComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  proveedores: ProveedorDto[] = [];
  filteredProveedores$!: Observable<ProveedorDto[]>;
  showAddProveedor$!: Observable<boolean>;

  @ViewChild('fechaInput') fechaInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EgresoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EgresoDto | null,
    private egresosService: EgresosService,
    private proveedorService: ProveedorService,
    private dialog: MatDialog,
    private fechaUtilService: FechaUtilService
  ) {
    this.form = this.fb.group({
      fecha: [new Date() as Date | null, Validators.required],
      valor: [0, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      proveedor: [null as ProveedorDto | null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadProveedores();

    this.filteredProveedores$ = this.form.get('proveedor')!.valueChanges.pipe(
      startWith(this.form.get('proveedor')!.value),
      map((value) => this.filterProveedores(value))
    );

    this.showAddProveedor$ = this.filteredProveedores$.pipe(
      combineLatestWith(this.form.get('proveedor')!.valueChanges.pipe(startWith(this.form.get('proveedor')!.value))),
      map(([filtered, value]) => {
        const isFiltering = typeof value === 'string' && (value || '').trim().length > 0;
        return isFiltering && filtered.length === 0;
      })
    );

    if (this.data) {
      const prov = this.data.proveedor;
      this.form.patchValue({
        fecha: this.data.fecha ? this.fechaUtilService.parseDateAsLocal(this.data.fecha) : null,
        valor: this.data.valor ?? 0,
        descripcion: this.data.descripcion || '',
        proveedor: prov ? { id: prov.id, nombre: prov.nombre, tipoEgreso: prov.tipoEgreso } : null
      });
      this.patchProveedorAfterLoad();
    }
  }

  private loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (prov) => {
        this.proveedores = prov;
        this.patchProveedorAfterLoad();
      }
    });
  }

  private patchProveedorAfterLoad() {
    if (!this.data) return;
    const prov = this.proveedores.find(p => p.id === this.data!.proveedor?.id);
    if (prov) this.form.patchValue({ proveedor: prov }, { emitEvent: false });
  }

  private filterProveedores(value: ProveedorDto | string | null): ProveedorDto[] {
    if (typeof value === 'object' && value !== null) return [...this.proveedores];
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : '';
    if (!filterValue) return [...this.proveedores];
    return this.proveedores.filter(p =>
      p.nombre.toLowerCase().includes(filterValue)
    );
  }

  displayProveedor(prov: ProveedorDto | null): string {
    return prov ? prov.nombre : '';
  }

  onProveedorKeydown(event: Event) {
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter') return;
    const value = this.form.get('proveedor')?.value;
    const filtered = this.filterProveedores(value);
    const showAdd = typeof value === 'string' && (value || '').trim().length > 0 && filtered.length === 0;
    if (showAdd) {
      ke.preventDefault();
      ke.stopPropagation();
      this.openNuevoProveedor(event);
    }
  }

  openNuevoProveedor(event?: Event) {
    if (event) {
      event.stopPropagation();
      (event as KeyboardEvent)?.preventDefault?.();
    }
    const valor = this.form.get('proveedor')?.value;
    const initialNombre = typeof valor === 'string' && valor?.trim() ? valor.trim() : undefined;
    const proveedorDialogRef = this.dialog.open(ProveedorEditComponent, {
      width: '500px',
      data: initialNombre ? { initialNombre } : null
    });
    proveedorDialogRef.afterClosed().subscribe((result: ProveedorDto | undefined) => {
      if (result) {
        this.proveedores = [...this.proveedores, result];
        this.form.patchValue({ proveedor: result });
      }
    });
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
      if (this.fechaInput?.nativeElement) {
        this.fechaInput.nativeElement.focus({ preventScroll: true });
      }
    } catch (e) {
      console.debug('Focus management skipped:', e);
    }
  }

  get isEditMode(): boolean {
    return !!(this.data && this.data.id && this.data.id !== 0);
  }

  get buttonLabel(): string {
    return this.isEditMode ? 'Actualizar egreso' : 'Registrar egreso';
  }

  save() {
    if (this.form.invalid) return;

    const form = this.form.value;
    const prov = form.proveedor as ProveedorDto;

    const fechaValue = form.fecha as Date | null;
    const fechaStr = fechaValue
      ? `${fechaValue.getFullYear()}-${String(fechaValue.getMonth() + 1).padStart(2, '0')}-${String(fechaValue.getDate()).padStart(2, '0')}`
      : '';

    const request: CreateEgresoRequest = {
      fecha: fechaStr,
      valor: Number(form.valor),
      descripcion: form.descripcion || '',
      proveedor: { id: prov.id }
    };

    if (this.isEditMode) {
      this.egresosService.updateEgreso(this.data!.id, request).subscribe({
        next: (result) => this.dialogRef.close({ ...result, _edit: true }),
        error: (err) => alert('Error al actualizar: ' + (err?.error?.message || err.message || err))
      });
    } else {
      this.egresosService.createEgreso(request).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => alert('Error al guardar: ' + (err?.error?.message || err.message || err))
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
