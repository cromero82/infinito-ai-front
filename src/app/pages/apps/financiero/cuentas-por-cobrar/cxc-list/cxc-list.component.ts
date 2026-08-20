import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import {
  UntypedFormControl,
  FormControl,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FooterService } from '../../../../../layouts/services/footer.service';
import { TableViewportService } from '../../../../../core/table-viewport/table-viewport.service';
import { FechaUtilService } from '../../../ventas/service/fecha-util.service';
import {
  CuentaPorCobrarDto,
  CuentaPorCobrarService
} from '../../../ventas/service/cuenta-por-cobrar.service';
import {
  RegistrarAbonoCxcDialogComponent,
  RegistrarAbonoCxcDialogData,
  RegistrarAbonoCxcDialogResult
} from '../../../ventas/registrar-abono-cxc-dialog/registrar-abono-cxc-dialog.component';

type TabCxC = 'vigentes' | 'archivados';
type RiesgoNivel = 'normal' | 'medio' | 'alto' | 'n/a';

/** Defaults de alertas.creditos.tiempoRiesgos (días desde fecha_origen). */
const RIESGO_DEFAULT = { normal: 5, medio: 15, alto: 35 };

@Component({
  selector: 'gm-cxc-list',
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './cxc-list.component.html',
  styleUrl: './cxc-list.component.scss'
})
export class CxcListComponent implements OnInit, AfterViewInit, OnDestroy {
  tabIndex = 0;
  displayedColumns: string[] = [
    'cliente',
    'ticket',
    'origen',
    'original',
    'abonado',
    'saldo',
    'estado',
    'riesgo',
    'acciones'
  ];
  dataSource: CuentaPorCobrarDto[] = [];
  filteredDataSource: CuentaPorCobrarDto[] = [];
  selectedRowId: number | null = null;
  loading = false;
  searchCtrl = new UntypedFormControl('');
  riesgoFilterCtrl = new FormControl<RiesgoNivel | ''>('');
  tableScrollMaxHeight = 400;

  private readonly moneyFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private cxcService: CuentaPorCobrarService,
    private tableViewportService: TableViewportService,
    private fechaUtilService: FechaUtilService,
    private footerService: FooterService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.footerService.clearFooterItems();
    this.applyViewport();
    this.load();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
    this.riesgoFilterCtrl.valueChanges.subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 100);
  }

  ngOnDestroy(): void {
    this.footerService.clearFooterItems();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.applyViewport();
  }

  private applyViewport(): void {
    const v = this.tableViewportService.calculate({ reservedHeight: 420 });
    this.tableScrollMaxHeight = v.maxHeight;
  }

  get tabActual(): TabCxC {
    return this.tabIndex === 0 ? 'vigentes' : 'archivados';
  }

  onTabChange(index: number): void {
    this.tabIndex = index;
    this.selectedRowId = null;
    this.searchCtrl.setValue('', { emitEvent: false });
    this.riesgoFilterCtrl.setValue('', { emitEvent: false });
    this.load();
  }

  load(): void {
    this.loading = true;
    const req =
      this.tabActual === 'vigentes'
        ? this.cxcService.listarVigentes()
        : this.cxcService.listarArchivados();
    req.subscribe({
      next: (rows) => {
        this.dataSource = rows ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.dataSource = [];
        this.filteredDataSource = [];
        this.snackBar.open(
          err?.error?.message ||
            err?.message ||
            'No se pudieron cargar las cuentas por cobrar',
          'Cerrar',
          { duration: 4500 }
        );
      }
    });
  }

  private applyFilters(): void {
    const q = String(this.searchCtrl.value ?? '')
      .trim()
      .toLowerCase();
    const riesgo = this.riesgoFilterCtrl.value;
    this.filteredDataSource = this.dataSource.filter((row) => {
      if (riesgo && this.riesgoDe(row) !== riesgo) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        row.clienteNombre,
        row.clienteTelefono,
        row.clienteCorreo,
        row.ticketId != null ? String(row.ticketId) : '',
        row.id != null ? String(row.id) : '',
        row.estado
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  formatMoney(n: number | null | undefined): string {
    return this.moneyFmt.format(Math.round(Number(n) || 0));
  }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return '—';
    }
    try {
      const d = this.fechaUtilService.parseDateAsLocal(fecha);
      if (isNaN(d.getTime())) {
        return fecha;
      }
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  abonado(row: CuentaPorCobrarDto): number {
    const original = Number(row.montoOriginal) || 0;
    const saldo = Number(row.saldoPendiente) || 0;
    return Math.max(0, original - saldo);
  }

  diasDesdeOrigen(row: CuentaPorCobrarDto): number {
    if (!row.fechaOrigen) {
      return 0;
    }
    const origen = new Date(row.fechaOrigen).getTime();
    if (Number.isNaN(origen)) {
      return 0;
    }
    const ms = Date.now() - origen;
    return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
  }

  riesgoDe(row: CuentaPorCobrarDto): RiesgoNivel {
    if (row.estado === 'PAGADA' || row.estado === 'ANULADA') {
      return 'n/a';
    }
    const dias = this.diasDesdeOrigen(row);
    if (dias >= RIESGO_DEFAULT.alto) {
      return 'alto';
    }
    if (dias >= RIESGO_DEFAULT.medio) {
      return 'medio';
    }
    return 'normal';
  }

  riesgoLabel(row: CuentaPorCobrarDto): string {
    const r = this.riesgoDe(row);
    if (r === 'n/a') {
      return '—';
    }
    const dias = this.diasDesdeOrigen(row);
    const mapa: Record<Exclude<RiesgoNivel, 'n/a'>, string> = {
      normal: 'Normal',
      medio: 'Medio',
      alto: 'Alto'
    };
    return `${mapa[r]} (${dias}d)`;
  }

  selectRow(row: CuentaPorCobrarDto): void {
    this.selectedRowId = row.id;
  }

  abrirAbono(row: CuentaPorCobrarDto, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open<
      RegistrarAbonoCxcDialogComponent,
      RegistrarAbonoCxcDialogData,
      RegistrarAbonoCxcDialogResult | undefined
    >(RegistrarAbonoCxcDialogComponent, {
      width: '440px',
      data: { cuenta: row },
      autoFocus: true
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  irATickets(row: CuentaPorCobrarDto, event: Event): void {
    event.stopPropagation();
    if (row.ticketId == null) {
      this.snackBar.open('Esta cuenta no tiene ticket asociado.', 'Cerrar', {
        duration: 3500
      });
      return;
    }
    void this.router.navigate(['/apps/tickets'], {
      queryParams: { ticketId: row.ticketId }
    });
  }
}
