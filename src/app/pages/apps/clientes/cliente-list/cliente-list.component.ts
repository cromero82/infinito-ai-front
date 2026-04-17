import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  UntypedFormControl,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import {
  ClienteService,
  ClienteDto
} from '../../ventas/service/cliente.service';
import { ClienteEditComponent } from '../cliente-edit/cliente-edit.component';

@Component({
  selector: 'vex-cliente-list',
  imports: [
    VexPageLayoutComponent,
    VexPageLayoutHeaderDirective,
    VexPageLayoutContentDirective,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './cliente-list.component.html',
  styleUrl: './cliente-list.component.scss'
})
export class ClienteListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nombre', 'telefono', 'documento', 'edit'];
  dataSource: ClienteDto[] = [];
  filteredDataSource: ClienteDto[] = [];
  loading = false;
  searchCtrl = new UntypedFormControl('');
  private justClosedDialog = false;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  minHeightPanelClientesValue = 420;

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadClientes();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
        this.justClosedDialog = false;
        this.filterClientes(value);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  loadClientes() {
    this.loading = true;
    this.clienteService.getClientes().subscribe({
      next: (clientes) => {
        this.dataSource = clientes;
        this.filteredDataSource = clientes;
        this.loading = false;
      },
      error: () => {
        this.dataSource = [];
        this.filteredDataSource = [];
        this.loading = false;
      }
    });
  }

  filterClientes(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredDataSource = [...this.dataSource];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredDataSource = this.dataSource.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(term) ||
        (cliente.telefono && cliente.telefono.toLowerCase().includes(term)) ||
        (cliente.documento && cliente.documento.toLowerCase().includes(term)) ||
        cliente.id.toString().includes(term)
    );
  }

  createCliente() {
    const dialogRef = this.dialog.open(ClienteEditComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result) {
        this.loadClientes();
      }
      this.focusSearchInput();
    });
  }

  editCliente(cliente: ClienteDto) {
    const dialogRef = this.dialog.open(ClienteEditComponent, {
      width: '600px',
      data: cliente
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.justClosedDialog = true;
      if (result && result._edit) {
        this.loadClientes();
      }
      this.focusSearchInput();
    });
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

  getMinHeightValue(): number {
    return this.minHeightPanelClientesValue;
  }

  getMaxHeightListValue(): number {
    const headerHeight = 34;
    const calculatedHeight = this.minHeightPanelClientesValue - headerHeight;
    return Math.max(200, calculatedHeight);
  }
}
