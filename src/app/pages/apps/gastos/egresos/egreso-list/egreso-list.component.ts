import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntypedFormControl, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { EgresosService, EgresoDto, EgresoSearchParams } from '../service/egresos.service';
import { TipoEgresoService, TipoEgresoDto } from '../service/tipo-egreso.service';
import { ProveedorService, ProveedorDto } from '../../proveedores/service/proveedor.service';
import { EgresoEditComponent } from '../egreso-edit/egreso-edit.component';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';

@Component({
  selector: 'gm-egreso-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    NgFor,
    NgIf
  ],
  templateUrl: './egreso-list.component.html',
  styleUrl: './egreso-list.component.scss'
})
export class EgresoListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = [
    'fecha', 'valor', 'proveedor', 'tipoEgreso', 'descripcion', 'edit'
  ];
  dataSource: EgresoDto[] = [];
  loading = false;
  loadingMore = false;
  descripcionCtrl = new UntypedFormControl('');
  tipoEgresoIdCtrl = new FormControl<number | ''>('');
  proveedorIdCtrl = new FormControl<number | ''>('');
  tiposEgreso: TipoEgresoDto[] = [];
  proveedores: ProveedorDto[] = [];

  pageSize = 10;
  pageIndex = 0;
  totalElements = 0;
  hasMore = false;
  tableScrollMaxHeight = 400;

  private justClosedDialog = false;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tableScroll') tableScroll!: ElementRef<HTMLElement>;

  constructor(
    private egresosService: EgresosService,
    private tipoEgresoService: TipoEgresoService,
    private proveedorService: ProveedorService,
    private dialog: MatDialog,
    private tableViewportService: TableViewportService,
    private fechaUtilService: FechaUtilService
  ) {}

  ngOnInit() {
    this.applyViewport();
    this.loadTiposYProveedores();
    this.searchEgresos();

    this.descripcionCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.justClosedDialog = false;
        this.searchEgresos();
      });

    this.tipoEgresoIdCtrl.valueChanges.subscribe(() => this.searchEgresos());
    this.proveedorIdCtrl.valueChanges.subscribe(() => this.searchEgresos());
  }

  private loadTiposYProveedores() {
    this.tipoEgresoService.getTiposEgreso().subscribe(t => (this.tiposEgreso = t));
    this.proveedorService.getProveedores().subscribe(p => (this.proveedores = p));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput?.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
      this.attachScrollListener();
    }, 100);
  }

  ngOnDestroy() {
    this.detachScrollListener();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.applyViewport();
  }

  private applyViewport() {
    const v = this.tableViewportService.calculate({ reservedHeight: 388 });
    this.pageSize = v.pageSize;
    this.tableScrollMaxHeight = v.maxHeight;
  }

  private attachScrollListener() {
    this.detachScrollListener();
    const el = this.tableScroll?.nativeElement;
    if (el) {
      el.addEventListener('scroll', this.onTableScrollBound);
    }
  }

  private detachScrollListener() {
    const el = this.tableScroll?.nativeElement;
    if (el) {
      el.removeEventListener('scroll', this.onTableScrollBound);
    }
  }

  private onTableScrollBound = () => this.onTableScroll();

  private onTableScroll() {
    const el = this.tableScroll?.nativeElement;
    if (!el || this.loadingMore || !this.hasMore || this.loading) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 100;
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      this.loadMoreEgresos();
    }
  }

  loadMoreEgresos() {
    if (this.loadingMore || !this.hasMore) return;
    this.loadingMore = true;
    const params: EgresoSearchParams = {
      descripcion: this.descripcionCtrl.value?.trim() || undefined,
      tipoEgresoId: this.tipoEgresoIdCtrl.value !== '' ? Number(this.tipoEgresoIdCtrl.value) : undefined,
      proveedorId: this.proveedorIdCtrl.value !== '' ? Number(this.proveedorIdCtrl.value) : undefined,
      page: this.pageIndex + 1,
      size: this.pageSize
    };

    this.egresosService.searchEgresos(params).subscribe({
      next: (page) => {
        this.dataSource = [...this.dataSource, ...page.content];
        this.pageIndex = page.number;
        this.totalElements = page.totalElements;
        this.hasMore = !page.last;
        this.loadingMore = false;
        setTimeout(() => this.maybeLoadMoreIfNoScroll(), 50);
      },
      error: () => {
        this.loadingMore = false;
      }
    });
  }

  private maybeLoadMoreIfNoScroll() {
    if (this.loading || this.loadingMore || !this.hasMore) return;
    const el = this.tableScroll?.nativeElement;
    if (!el) return;
    const { scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 10 && this.hasMore) {
      this.loadMoreEgresos();
    }
  }

  searchEgresos() {
    this.loading = true;
    this.pageIndex = 0;
    const params: EgresoSearchParams = {
      descripcion: this.descripcionCtrl.value?.trim() || undefined,
      tipoEgresoId: this.tipoEgresoIdCtrl.value !== '' ? Number(this.tipoEgresoIdCtrl.value) : undefined,
      proveedorId: this.proveedorIdCtrl.value !== '' ? Number(this.proveedorIdCtrl.value) : undefined,
      page: 0,
      size: this.pageSize
    };

    this.egresosService.searchEgresos(params).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.pageIndex = page.number;
        this.totalElements = page.totalElements;
        this.hasMore = !page.last;
        this.loading = false;
        setTimeout(() => {
          this.attachScrollListener();
          this.maybeLoadMoreIfNoScroll();
        }, 50);
      },
      error: () => {
        this.dataSource = [];
        this.hasMore = false;
        this.loading = false;
      }
    });
  }

  limpiarFiltros() {
    this.descripcionCtrl.setValue('');
    this.tipoEgresoIdCtrl.setValue('');
    this.proveedorIdCtrl.setValue('');
    this.searchEgresos();
  }

  createEgreso() {
    const dialogRef = this.dialog.open(EgresoEditComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      this.justClosedDialog = true;
      if (result) {
        this.searchEgresos();
      }
      this.focusSearchInput();
    });
  }

  editEgreso(egreso: EgresoDto) {
    const dialogRef = this.dialog.open(EgresoEditComponent, {
      width: '600px',
      data: egreso
    });

    dialogRef.afterClosed().subscribe(result => {
      this.justClosedDialog = true;
      if (result && result._edit) {
        this.searchEgresos();
      }
      this.focusSearchInput();
    });
  }

  private focusSearchInput() {
    if (this.searchInput?.nativeElement) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
        if (this.descripcionCtrl.value) {
          this.searchInput.nativeElement.select();
        }
      }, 100);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    try {
      const d = this.fechaUtilService.parseDateAsLocal(fecha);
      if (isNaN(d.getTime())) return fecha;
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
}
