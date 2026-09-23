import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import {
  UntypedFormControl,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import {
  ProveedorService,
  ProveedorDto,
  getDocumentoDisplay,
  isUuidDocumento
} from '../service/proveedor.service';
import { ProveedorEditComponent } from '../proveedor-edit/proveedor-edit.component';
import {
  PersonaDto,
  PersonaService
} from '../../egresos/service/persona.service';
import { PersonaGestionDialogComponent } from '../../../dominios/persona/persona-gestion-dialog.component';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';

@Component({
  selector: 'vex-proveedor-list',
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './proveedor-list.component.html',
  styleUrl: './proveedor-list.component.scss'
})
export class ProveedorListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'nombre',
    'tipoEgreso',
    'telefono',
    'documento',
    'correo',
    'edit'
  ];
  dataSource: ProveedorDto[] = [];
  filteredDataSource: ProveedorDto[] = [];
  personas: PersonaDto[] = [];
  filteredPersonas: PersonaDto[] = [];
  catalogTab: 'empresas' | 'personas' = 'empresas';
  displayedPersonaColumns = [
    'nombre',
    'documento',
    'telefono',
    'correo',
    'dueño',
    'activo',
    'edit'
  ];
  selectedRowId: number | null = null;
  loading = false;
  loadingPersonas = false;
  searchCtrl = new UntypedFormControl('');
  tableScrollMaxHeight = 400;
  private justClosedDialog = false;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private proveedorService: ProveedorService,
    private personaService: PersonaService,
    private dialog: MatDialog,
    private tableViewportService: TableViewportService
  ) {}

  ngOnInit() {
    this.applyViewport();
    this.loadProveedores();
    this.loadPersonas();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
        this.justClosedDialog = false;
        this.filterProveedores(value);
        this.filterPersonas(value);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.applyViewport();
  }

  private applyViewport() {
    const v = this.tableViewportService.calculate({ reservedHeight: 428 });
    this.tableScrollMaxHeight = v.maxHeight;
  }

  loadProveedores() {
    this.loading = true;
    this.proveedorService.getProveedores().subscribe({
      next: (proveedores) => {
        this.dataSource = proveedores;
        this.filteredDataSource = proveedores;
        this.loading = false;
      },
      error: () => {
        this.dataSource = [];
        this.filteredDataSource = [];
        this.loading = false;
      }
    });
  }

  loadPersonas() {
    this.loadingPersonas = true;
    this.personaService.getAll(false).subscribe({
      next: (list) => {
        this.personas = [...(list || [])].sort((a, b) =>
          (a.nombre || '').localeCompare(b.nombre || '')
        );
        this.filterPersonas(this.searchCtrl.value);
        this.loadingPersonas = false;
      },
      error: () => {
        this.personas = [];
        this.filteredPersonas = [];
        this.loadingPersonas = false;
      }
    });
  }

  onCatalogTabChange(index: number): void {
    this.catalogTab = index === 1 ? 'personas' : 'empresas';
    this.selectedRowId = null;
    this.focusSearchInput();
  }

  filterPersonas(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredPersonas = [...this.personas];
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    this.filteredPersonas = this.personas.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.documento || '').toLowerCase().includes(term) ||
        (p.telefono || '').toLowerCase().includes(term) ||
        (p.correo || '').toLowerCase().includes(term) ||
        String(p.id).includes(term)
    );
  }

  createPersona() {
    const dialogRef = this.dialog.open(PersonaGestionDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { startInCreate: true, returnOnSave: true }
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result) {
        this.loadPersonas();
      }
      this.focusSearchInput();
    });
  }

  editPersona(persona: PersonaDto) {
    const dialogRef = this.dialog.open(PersonaGestionDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { editPersona: persona, returnOnSave: true }
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result) {
        this.loadPersonas();
      }
      this.focusSearchInput();
    });
  }

  selectPersonaRow(persona: PersonaDto): void {
    this.selectedRowId = persona.id;
  }

  isPersonaRowSelected(persona: PersonaDto): boolean {
    return this.selectedRowId === persona.id;
  }

  filterProveedores(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredDataSource = [...this.dataSource];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const matchAutogenerado =
      term === 'autogenerado' || term === '(autogenerado)';
    this.filteredDataSource = this.dataSource.filter(
      (proveedor) =>
        proveedor.nombre.toLowerCase().includes(term) ||
        (proveedor.telefono &&
          proveedor.telefono.toLowerCase().includes(term)) ||
        (proveedor.documento &&
          proveedor.documento.toLowerCase().includes(term)) ||
        (matchAutogenerado && isUuidDocumento(proveedor.documento)) ||
        (proveedor.correo && proveedor.correo.toLowerCase().includes(term)) ||
        proveedor.id.toString().includes(term)
    );
  }

  createProveedor() {
    const dialogRef = this.dialog.open(ProveedorEditComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result) {
        this.loadProveedores();
      }
      this.focusSearchInput();
    });
  }

  editProveedor(proveedor: ProveedorDto) {
    const dialogRef = this.dialog.open(ProveedorEditComponent, {
      width: '600px',
      data: proveedor
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result && result._edit) {
        this.loadProveedores();
      }
      this.focusSearchInput();
    });
  }

  getDocumentoDisplay(documento: string | null | undefined): string {
    return getDocumentoDisplay(documento);
  }

  selectRow(proveedor: ProveedorDto): void {
    this.selectedRowId = proveedor.id;
  }

  isRowSelected(proveedor: ProveedorDto): boolean {
    return this.selectedRowId === proveedor.id;
  }

  private focusSearchInput() {
    if (this.searchInput?.nativeElement) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
        if (this.searchCtrl.value) {
          this.searchInput.nativeElement.select();
        }
      }, 100);
    }
  }
}
