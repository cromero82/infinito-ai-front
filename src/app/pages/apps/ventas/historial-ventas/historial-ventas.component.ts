import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  HistorialReciboService,
  HistorialReciboDto,
  HistorialReciboPage,
  HistorialReciboPagoDto,
  HistorialDocumentosDto
} from '../service/historial-recibo.service';
import {
  HistorialReciboDetalleService,
  HistorialReciboDetalleDto
} from '../service/historial-recibo-detalle.service';
import {
  EstadoRecibosService,
  EstadoReciboDto
} from '../service/estado-recibos.service';
import { SesionesService } from '../service/sesiones.service';
import { ClienteService, ClienteDto } from '../service/cliente.service';
import {
  MetodoPagoService,
  MetodoPagoDto
} from '../service/metodo-pago.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { FooterService } from '../../../../layouts/services/footer.service';
import { FechaUtilService } from '../service/fecha-util.service';
import { ReciboPrintService } from '../service/recibo-print.service';
import { EstablecimientoService } from '../service/establecimiento.service';
import {
  RestaurarTicketDialogComponent,
  RestaurarTicketDialogResult
} from './restaurar-ticket-dialog.component';
import {
  TicketProductosDialogComponent,
  TicketProductosDialogData
} from '../ticket-productos-dialog/ticket-productos-dialog.component';
import {
  esNotificacionConfirmada,
  labelNotificacionElectronica
} from '../util/notificacion-electronica-ticket.util';

@Component({
  selector: 'vex-historial-ventas',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule,
    MatDialogModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  templateUrl: './historial-ventas.component.html',
  styleUrls: ['./historial-ventas.component.scss']
})
export class HistorialVentasComponent implements OnInit, OnDestroy {
  selectedFilter = 'pagado'; // Por defecto "pagado"
  fechaCtrl = new FormControl<Date | null>(null);
  /** '' = todos, 'MIXTO' = multipago, número = metodoPagoId */
  metodoPagoFilterCtrl = new FormControl<string | number>('', {
    nonNullable: true
  });
  sinCorteCtrl = new FormControl<boolean>(false, { nonNullable: true });
  historialRecibos: HistorialReciboDto[] = [];
  loading = false;
  loadingMore = false;
  error: string | null = null;
  page = 1;
  size = 10;
  totalElements = 0;
  totalPages = 0;
  sesionIdFromUrl: number | null = null; // Parámetro de la URL
  userInfo: { nombre: string; correoElectronico: string } | null = null;
  userInfoLoading = false;
  private destroy$ = new Subject<void>();
  @ViewChild('recibosList', { static: false })
  recibosListRef?: ElementRef<HTMLDivElement>;

  // Detalles state
  selectedReciboId: number | null = null;
  detalles: HistorialReciboDetalleDto[] = [];
  detallesLoading = false;
  detallesError: string | null = null;
  pagosSeleccionados: HistorialReciboPagoDto[] = [];
  pagosLoading = false;

  // Estados state
  estadosRecibos: EstadoReciboDto[] = [];
  anulandoRecibo = false;
  volviendoAEditar = false;
  imprimiendoRecibo = false;
  restaurandoTicket = false;

  documentos: HistorialDocumentosDto | null = null;
  documentosLoading = false;
  documentosError: string | null = null;

  // Clientes state
  clientes: ClienteDto[] = [];
  clientesLoading = false;

  // Métodos de pago state
  metodosPago: MetodoPagoDto[] = [];
  metodosPagoLoading = false;

  constructor(
    private historialReciboService: HistorialReciboService,
    private historialReciboDetalleService: HistorialReciboDetalleService,
    private estadoRecibosService: EstadoRecibosService,
    private sesionesService: SesionesService,
    private clienteService: ClienteService,
    private metodoPagoService: MetodoPagoService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private footerService: FooterService,
    private fechaUtilService: FechaUtilService,
    private reciboPrintService: ReciboPrintService,
    private establecimientoService: EstablecimientoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.establecimientoService
      .loadActual()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: () => undefined });
    this.footerService.clearFooterItems();

    // Read sesionId from URL query parameters and fetch user info
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['sesionId']) {
          const id = Number(params['sesionId']);
          this.sesionIdFromUrl = id;
          this.userInfoLoading = true;
          this.userInfo = null;
          this.sesionesService
            .getUsuarioBySesionId(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (u) => {
                this.userInfo = {
                  nombre: u.nombre,
                  correoElectronico: u.correoElectronico
                };
                this.userInfoLoading = false;
              },
              error: () => {
                this.userInfoLoading = false;
              }
            });
        } else {
          this.sesionIdFromUrl = null;
          this.userInfo = null;
          this.userInfoLoading = false;
        }
      });

    this.loadClientes();
    this.loadMetodosPago();
    this.loadEstadosRecibos();

    this.metodoPagoFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.reloadFromFilters());
    this.sinCorteCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.reloadFromFilters());
  }

  private reloadFromFilters(): void {
    this.page = 1;
    this.historialRecibos = [];
    this.loadHistorialRecibos();
  }

  loadClientes(): void {
    this.clientesLoading = true;
    this.clienteService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes;
          this.clientesLoading = false;
        },
        error: (err) => {
          console.error('Error loading clientes', err);
          this.clientesLoading = false;
        }
      });
  }

  loadMetodosPago(): void {
    this.metodosPagoLoading = true;
    this.metodoPagoService
      .obtenerMetodosPagoParaTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodosPago) => {
          this.metodosPago = metodosPago;
          this.metodosPagoLoading = false;
        },
        error: (err) => {
          console.error('Error loading metodos pago', err);
          this.metodosPagoLoading = false;
        }
      });
  }

  loadEstadosRecibos(): void {
    this.estadoRecibosService
      .getEstadosRecibos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estados) => {
          this.estadosRecibos = estados;
          // Cargar recibos después de cargar los estados para poder usar el filtro por defecto
          this.loadHistorialRecibos();
        },
        error: (err) => {
          console.error('Error loading estados recibos', err);
          // Cargar recibos incluso si hay error cargando estados
          this.loadHistorialRecibos();
        }
      });
  }

  ngOnDestroy(): void {
    this.footerService.clearFooterItems();
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectFilter(filter: string): void {
    this.selectedFilter = filter;
    this.page = 1;
    this.historialRecibos = [];
    this.loadHistorialRecibos();
  }

  getEstadoIdByFilter(filter: string): number | undefined {
    if (filter === 'todos' || filter === 'restaurados') {
      return undefined;
    }

    const estado = this.estadosRecibos.find((e) => {
      if (filter === 'pagado') {
        return e.sigla === 'P';
      } else if (filter === 'anulados') {
        return e.sigla === 'AN';
      }
      return false;
    });

    return estado?.id;
  }

  onFechaChange(): void {
    this.page = 1;
    this.historialRecibos = [];
    this.loadHistorialRecibos();
  }

  private buildSearchOpts(): {
    metodoPagoId?: number | null;
    mixto?: boolean;
    sinCorte?: boolean;
  } {
    const raw = this.metodoPagoFilterCtrl.value;
    const opts: {
      metodoPagoId?: number | null;
      mixto?: boolean;
      sinCorte?: boolean;
    } = {};
    if (raw === 'MIXTO') {
      opts.mixto = true;
    } else if (raw !== '' && raw != null) {
      const id = Number(raw);
      if (!Number.isNaN(id) && id > 0) {
        opts.metodoPagoId = id;
      }
    }
    if (this.sinCorteCtrl.value) {
      opts.sinCorte = true;
    }
    return opts;
  }

  /** Etiqueta corta del medio en la lista (Mixto o nombre del dominio). */
  medioListaLabel(recibo: HistorialReciboDto): string {
    if (recibo.multipago) {
      return 'MIXTO';
    }
    return (this.getMetodoPagoNombre(recibo.metodoPagoId) ?? '—').toUpperCase();
  }

  medioListaColor(recibo: HistorialReciboDto): string | null {
    if (recibo.multipago) {
      return '#546e7a';
    }
    return this.getMetodoPago(recibo.metodoPagoId)?.color?.trim() || null;
  }

  labelNotif(recibo: HistorialReciboDto): string | null {
    return labelNotificacionElectronica(recibo.estadoNotificacionElectronica);
  }

  notifOk(recibo: HistorialReciboDto): boolean {
    return esNotificacionConfirmada(recibo.estadoNotificacionElectronica);
  }

  verProductos(recibo: HistorialReciboDto, event: Event): void {
    event.stopPropagation();
    const data: TicketProductosDialogData = {
      historialReciboId: recibo.id,
      titulo: recibo.documentoVentaConsecutivo
        ? `Productos · ${recibo.documentoVentaConsecutivo}`
        : `Productos · ticket #${recibo.id}`,
      totalTicket: recibo.total,
      sesionId: recibo.sesionId
    };
    this.dialog.open(TicketProductosDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data
    });
  }

  loadHistorialRecibos(): void {
    if (this.page === 1) {
      this.loading = true;
      this.historialRecibos = []; // Clear list when loading first page
    } else {
      this.loadingMore = true;
    }
    this.error = null;

    // Format date as YYYY-MM-DD if a date is selected
    let fechaParam: string | undefined;
    if (this.fechaCtrl.value) {
      const date = this.fechaCtrl.value;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      fechaParam = `${year}-${month}-${day}`;
    }

    // Get estadoId based on selected filter (default to pagado if not todos)
    const estadoId = this.getEstadoIdByFilter(this.selectedFilter);
    const soloRestaurados = this.selectedFilter === 'restaurados';

    this.historialReciboService
      .searchHistorialRecibos(
        this.page,
        this.size,
        'fechaCreacion,desc',
        fechaParam,
        estadoId,
        this.sesionIdFromUrl,
        soloRestaurados,
        this.buildSearchOpts()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: HistorialReciboPage) => {
          const newContent = page.content ?? [];

          if (this.page === 1) {
            // First page: replace the list
            this.historialRecibos = newContent;
          } else {
            // Subsequent pages: concatenate with existing results
            this.historialRecibos = this.historialRecibos.concat(newContent);
          }

          this.totalElements = page.totalElements ?? 0;
          this.totalPages = page.totalPages ?? 0;
          this.loading = false;
          this.loadingMore = false;

          const totalSum = this.historialRecibos.reduce(
            (sum, r) => sum + (r.total ?? 0),
            0
          );
          const totalFormatted = this.formatCurrency(totalSum);
          this.footerService.setFooterItems([
            {
              textoClave: 'Total',
              valorClave: totalFormatted,
              estiloCssClave: 'footer-item-total-highlight'
            }
          ]);
        },
        error: (err) => {
          console.error('Error loading historial recibos', err);
          this.error = 'Error al cargar el historial de ventas.';
          this.loading = false;
          this.loadingMore = false;
        }
      });
  }

  onRecibosListScroll(): void {
    if (!this.recibosListRef?.nativeElement) {
      return;
    }

    const element = this.recibosListRef.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Calculate remaining scrollable distance
    const remainingScroll = scrollHeight - (scrollTop + clientHeight);

    // Estimate item height (approximately 30-35px per item based on padding and content)
    const estimatedItemHeight = 35;
    // Calculate how many items are visible
    const visibleItems = Math.ceil(clientHeight / estimatedItemHeight);
    // Calculate how many items are remaining below the viewport
    const remainingItems = Math.ceil(remainingScroll / estimatedItemHeight);

    // Trigger pagination when there are only 2-3 items left visible (or 70-100px remaining)
    // This ensures we load more content before the user reaches the bottom
    const triggerThreshold = Math.max(70, estimatedItemHeight * 2.5); // At least 2.5 items worth of space

    const isNearBottom = remainingScroll <= triggerThreshold;

    // Only load if we're near bottom, have more pages, and not already loading
    if (
      isNearBottom &&
      this.page < this.totalPages &&
      !this.loadingMore &&
      !this.loading
    ) {
      const nextPage = this.page + 1;
      this.page = nextPage;
      this.loadHistorialRecibos();
    }
  }

  formatCurrency(value: number): string {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(value).replace('COP', '$').trim();
  }

  formatCurrencyWithBold(value: number): string {
    const formatted = this.formatCurrency(value);
    // Make the numeric part bold (everything after $ and space)
    // Format: "$ 420.000" -> "$ <b>420.000</b>"
    const match = formatted.match(/^\$\s*(.+)$/);
    if (match) {
      return `$ <b>${match[1]}</b>`;
    }
    return formatted;
  }

  formatDate(dateString: string): string {
    return this.fechaUtilService.formatDate(dateString);
  }

  selectRecibo(recibo: HistorialReciboDto): void {
    if (this.selectedReciboId === recibo.id) {
      return; // Already selected
    }

    this.selectedReciboId = recibo.id;
    this.detalles = [];
    this.detallesError = null;
    this.pagosSeleccionados = [];
    this.documentos = null;
    this.documentosError = null;
    this.loadDetalles(recibo.id);
    this.loadPagos(recibo.id);
    this.loadDocumentos(recibo.id);
  }

  loadPagos(reciboId: number): void {
    this.pagosLoading = true;
    this.historialReciboService
      .getPagos(reciboId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pagos) => {
          this.pagosSeleccionados = pagos ?? [];
          this.pagosLoading = false;
        },
        error: () => {
          this.pagosSeleccionados = [];
          this.pagosLoading = false;
        }
      });
  }

  loadDocumentos(reciboId: number): void {
    this.documentosLoading = true;
    this.documentosError = null;
    this.historialReciboService
      .getDocumentos(reciboId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docs) => {
          this.documentos = docs;
          this.documentosLoading = false;
        },
        error: () => {
          this.documentos = null;
          this.documentosError = null;
          this.documentosLoading = false;
        }
      });
  }

  loadDetalles(reciboId: number): void {
    this.detallesLoading = true;
    this.detallesError = null;

    this.historialReciboDetalleService
      .getDetallesByReciboId(reciboId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detalles) => {
          this.detalles = detalles;
          this.detallesLoading = false;
        },
        error: (err) => {
          console.error('Error loading detalles', err);
          this.detallesError = 'Error al cargar los detalles del recibo.';
          this.detallesLoading = false;
        }
      });
  }

  getTotalDetalles(): number {
    return this.detalles.reduce(
      (sum, detalle) => sum + Number(detalle.subtotal ?? 0),
      0
    );
  }

  getSelectedRecibo(): HistorialReciboDto | null {
    if (!this.selectedReciboId) {
      return null;
    }
    return (
      this.historialRecibos.find((r) => r.id === this.selectedReciboId) || null
    );
  }

  isReciboPagado(): boolean {
    const recibo = this.getSelectedRecibo();
    if (!recibo) {
      return false;
    }
    const estadoPagado = this.estadosRecibos.find((e) => e.sigla === 'P');
    if (!estadoPagado) {
      return false;
    }
    return recibo.estadoId === estadoPagado.id;
  }

  isReciboAnulado(): boolean {
    const recibo = this.getSelectedRecibo();
    if (!recibo) {
      return false;
    }
    const estadoAnulado = this.estadosRecibos.find((e) => e.sigla === 'AN');
    if (!estadoAnulado) {
      return false;
    }
    return recibo.estadoId === estadoAnulado.id;
  }

  anularVenta(): void {
    const recibo = this.getSelectedRecibo();
    if (!recibo) {
      return;
    }

    // Find the estado with sigla = "AN"
    const estadoAnulado = this.estadosRecibos.find((e) => e.sigla === 'AN');
    if (!estadoAnulado) {
      console.error('Estado "AN" (anulado) not found');
      return;
    }

    this.anulandoRecibo = true;

    // Send all required fields with updated estadoId (sesionId goes as query parameter)
    const updatePayload = {
      clienteId: recibo.clienteId,
      estadoId: estadoAnulado.id,
      metodoPagoId: recibo.metodoPagoId,
      total: recibo.total,
      montoRecibido: recibo.total // Al anular, montoRecibido es igual al total
    };

    this.historialReciboService
      .updateHistorialRecibo(recibo.id, recibo.sesionId, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRecibo) => {
          // Show success snackbar
          const totalFormateado = this.formatCurrency(recibo.total);
          const snackBarRef = this.snackBar.open(
            `Venta por valor de ${totalFormateado} Anulada correctamente`,
            undefined,
            {
              duration: 5000,
              horizontalPosition: 'right',
              panelClass: ['historial-ventas-snackbar-success']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector(
              '.historial-ventas-snackbar-success .mat-mdc-snack-bar-label'
            );
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(
                  currencyRegex,
                  `<strong>${match[0]}</strong>`
                );
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);

          // Clear the selection and details
          this.selectedReciboId = null;
          this.detalles = [];
          this.detallesError = null;
          this.documentos = null;

          this.page = 1;
          this.historialRecibos = [];
          this.loadHistorialRecibos();

          this.anulandoRecibo = false;
        },
        error: (err) => {
          console.error('Error anulando recibo', err);
          this.anulandoRecibo = false;
        }
      });
  }

  restaurarTicket(): void {
    const recibo = this.getSelectedRecibo();
    if (!recibo || !this.isReciboPagado()) {
      return;
    }

    const stored = localStorage.getItem('session-id');
    const sesionId = stored ? Number(stored) : recibo.sesionId;
    if (!sesionId || Number.isNaN(sesionId)) {
      this.snackBar.open('No hay sesión activa para restaurar', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    const dialogRef = this.dialog.open<
      RestaurarTicketDialogComponent,
      RestaurarTicketDialogResult | undefined
    >(RestaurarTicketDialogComponent, { width: '420px' });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.motivoTexto) {
        return;
      }

      this.restaurandoTicket = true;
      this.historialReciboService
        .restaurarTicket(recibo.id, sesionId, {
          motivoTexto: result.motivoTexto
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp) => {
            const nc = resp.notaCreditoConsecutivo ?? 'NC';
            this.snackBar.open(
              `Ticket restaurado. ${nc} generada.`,
              undefined,
              { duration: 5000, horizontalPosition: 'right' }
            );
            this.selectedReciboId = null;
            this.detalles = [];
            this.documentos = null;
            this.page = 1;
            this.historialRecibos = [];
            this.loadHistorialRecibos();
            this.restaurandoTicket = false;
            this.router.navigate(['/apps/tickets']);
          },
          error: (err) => {
            console.error('Error restaurando ticket', err);
            this.snackBar.open('No se pudo restaurar el ticket', 'Cerrar', {
              duration: 5000
            });
            this.restaurandoTicket = false;
          }
        });
    });
  }

  volverAEditar(): void {
    const recibo = this.getSelectedRecibo();
    if (!recibo) {
      return;
    }

    // Find the estado with sigla = "ED"
    const estadoEditar = this.estadosRecibos.find((e) => e.sigla === 'ED');
    if (!estadoEditar) {
      console.error('Estado "ED" (editar) not found');
      return;
    }

    // Get sesionId from localStorage
    const stored = localStorage.getItem('session-id');
    const sesionId = stored ? Number(stored) : null;
    if (!sesionId || Number.isNaN(sesionId)) {
      console.error('No se encontró sesionId en localStorage');
      return;
    }

    this.volviendoAEditar = true;

    this.historialReciboService
      .volverAEditar(recibo.id, sesionId, estadoEditar.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRecibo) => {
          // Show success snackbar
          const totalFormateado = this.formatCurrency(recibo.total);
          const snackBarRef = this.snackBar.open(
            `Venta por valor de ${totalFormateado} vuelta a editar correctamente`,
            undefined,
            {
              duration: 5000,
              horizontalPosition: 'right',
              panelClass: ['historial-ventas-snackbar-success']
            }
          );
          // Make the currency value bold
          setTimeout(() => {
            const snackBarElement = document.querySelector(
              '.historial-ventas-snackbar-success .mat-mdc-snack-bar-label'
            );
            if (snackBarElement) {
              const text = snackBarElement.textContent || '';
              const currencyRegex = /\$\s*[\d.,]+/;
              const match = text.match(currencyRegex);
              if (match) {
                const boldText = text.replace(
                  currencyRegex,
                  `<strong>${match[0]}</strong>`
                );
                snackBarElement.innerHTML = boldText;
              }
            }
          }, 0);

          // Clear the selection and details
          this.selectedReciboId = null;
          this.detalles = [];
          this.detallesError = null;
          this.documentos = null;

          this.page = 1;
          this.historialRecibos = [];
          this.loadHistorialRecibos();

          this.volviendoAEditar = false;

          // Redirigir a la pantalla de ventas
          this.router.navigate(['/apps/tickets']);
        },
        error: (err) => {
          console.error('Error volviendo a editar recibo', err);
          this.volviendoAEditar = false;
        }
      });
  }

  getClienteNombre(clienteId: number): string | null {
    const cliente = this.clientes.find((c) => c.id === clienteId);
    if (!cliente) {
      return null;
    }
    // Retornar null si es "ANONIMO" para no mostrarlo
    if (cliente.nombre === 'ANONIMO') {
      return null;
    }
    return cliente.nombre;
  }

  getMetodoPagoNombre(metodoPagoId: number): string | null {
    const metodoPago = this.metodosPago.find((m) => m.id === metodoPagoId);
    return metodoPago ? metodoPago.descripcion : null;
  }

  getMetodoPago(metodoPagoId: number): MetodoPagoDto | null {
    return this.metodosPago.find((m) => m.id === metodoPagoId) || null;
  }

  isMetodoPagoEfectivo(metodoPagoId: number): boolean {
    return metodoPagoId === 1;
  }

  esPagoMixtoSeleccionado(): boolean {
    return (this.pagosSeleccionados?.length ?? 0) > 1;
  }

  getMontoRecibido(recibo: HistorialReciboDto): number | null {
    return recibo.montoRecibido ?? null;
  }

  imprimirReciboSeleccionado(): void {
    const recibo = this.getSelectedRecibo();
    if (!recibo) {
      console.error('No hay recibo seleccionado para imprimir');
      return;
    }

    if (!this.detalles || this.detalles.length === 0) {
      console.error('No hay detalles para imprimir');
      return;
    }

    this.imprimiendoRecibo = true;

    try {
      const printable = this.reciboPrintService.toPrintableDetalles(
        this.detalles
      );
      const total = Number(recibo.total ?? 0);
      const montoRec =
        recibo.montoRecibido != null ? Number(recibo.montoRecibido) : total;
      const pagosLineas =
        this.pagosSeleccionados.length > 0
          ? this.pagosSeleccionados.map((p) => ({
              metodoPagoId: p.metodoPagoId,
              label: this.getMetodoPagoNombre(p.metodoPagoId) ?? `Medio ${p.metodoPagoId}`,
              monto: Number(p.monto)
            }))
          : null;
      const esEfectivoSolo =
        !pagosLineas ||
        (pagosLineas.length === 1 && this.isMetodoPagoEfectivo(pagosLineas[0].metodoPagoId!));
      const cambioVal = esEfectivoSolo ? Math.max(0, montoRec - total) : Math.max(0, montoRec - total);
      const impExtra = {
        metodoPagoLabel:
          pagosLineas && pagosLineas.length > 1
            ? 'MIXTO'
            : this.getMetodoPagoNombre(recibo.metodoPagoId),
        montoRecibido: montoRec,
        cambio: cambioVal > 0 ? cambioVal : null,
        pagosLineas
      };
      this.reciboPrintService.registerRecentRecibo(
        recibo,
        printable,
        this.getClienteNombre(recibo.clienteId),
        impExtra
      );
      const printed = this.reciboPrintService.printRecibo({
        fechaCreacion: recibo.fechaCreacion,
        detalles: printable,
        clienteNombre: this.getClienteNombre(recibo.clienteId),
        establecimiento: ReciboPrintService.toImpresionEstablecimiento(
          this.establecimientoService.getSnapshot()
        ),
        documentoVentaConsecutivo: recibo.documentoVentaConsecutivo ?? null,
        ...impExtra
      });

      if (!printed) {
        console.error(
          'No se pudo abrir la ventana de impresión - ventanas emergentes bloqueadas'
        );
        this.snackBar.open(
          'Por favor, permite ventanas emergentes para imprimir',
          'Cerrar',
          {
            duration: 5000,
            horizontalPosition: 'right'
          }
        );
        this.imprimiendoRecibo = false;
        return;
      }

      // Resetear el estado de impresión después de un tiempo
      setTimeout(() => {
        this.imprimiendoRecibo = false;
      }, 2000);
    } catch (error) {
      console.error('Error al imprimir recibo:', error);
      this.snackBar.open('Error al imprimir el recibo', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'right'
      });
      this.imprimiendoRecibo = false;
    }
  }
}
