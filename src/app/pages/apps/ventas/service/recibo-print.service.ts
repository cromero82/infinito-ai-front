import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  EstablecimientoDto,
  EstablecimientoService
} from './establecimiento.service';

export interface PrintableReciboDetalle {
  productoId: number;
  cantidad: number;
  subtotal: number;
  producto?: {
    nombre: string;
    precio?: number | null;
    precioUnidad?: number | null;
  } | null;
}

/** Datos extra para la tirilla (pago, cambio, cajero). */
export interface ReciboPagoImpresionLinea {
  metodoPagoId?: number;
  label: string;
  monto: number;
}

export interface ReciboCreditoImpresionResumen {
  creditoOriginal: number;
  abonado: number;
  saldoPendiente: number;
  /** Nota al pie, p. ej. crédito pendiente por pagar. */
  nota?: string | null;
}

export interface ReciboTicketImpresionExtra {
  metodoPagoLabel?: string | null;
  montoRecibido?: number | null;
  cambio?: number | null;
  /** Si hay mixto, se imprimen estas líneas en lugar de un solo PAGO. */
  pagosLineas?: ReciboPagoImpresionLinea[] | null;
  /** Si no se envía, se usa `localStorage` key `user-nombre`. */
  atendidoNombre?: string | null;
  /** Bloque CxC en la tirilla (abono / saldo / crédito). */
  creditoResumen?: ReciboCreditoImpresionResumen | null;
}

export interface RecentPrintedReciboItem {
  reciboId: number;
  total: number;
  fechaCreacion: string;
  /** Nombre para mostrar si el ticket/recibo tiene cliente (no ANONIMO). */
  clienteNombre?: string | null;
  detalles: PrintableReciboDetalle[];
  metodoPagoLabel?: string | null;
  montoRecibido?: number | null;
  cambio?: number | null;
  pagosLineas?: ReciboPagoImpresionLinea[] | null;
}

export interface ReciboImpresionEstablecimiento {
  razonSocial: string;
  nombreComercial?: string | null;
  nit?: string | null;
  digitoVerificacion?: string | null;
  regimenTributario?: string | null;
  regimenLeyendaImpresion?: string | null;
  direccion?: string | null;
}

export interface ReciboImpresionOpciones extends ReciboTicketImpresionExtra {
  fechaCreacion?: string | Date | null;
  /** Si se indica, tiene prioridad sobre `fechaCreacion` para la hora en el ticket. */
  fechaEmision?: Date | null;
  detalles: PrintableReciboDetalle[];
  /** Nombre tal cual viene del recibo/ticket; vacío o ANONIMO → "Anonimo" en CLIENTE. */
  clienteNombre?: string | null;
  establecimiento?: ReciboImpresionEstablecimiento | null;
  documentoVentaConsecutivo?: string | null;
}

/**
 * Ancho de ticket para CSS/@page. Las impresoras POS 58 mm (p. ej. 58ENG) deben coincidir aquí;
 * si se usa 80 mm, configurar el mismo ancho en el diálogo de impresión o cambiar este valor.
 */
export const RECIBO_TICKET_WIDTH_MM = 58;

const LS_USER_NOMBRE = 'user-nombre';

@Injectable({
  providedIn: 'root'
})
export class ReciboPrintService {
  private readonly recentRecibosStorageKey = 'recent-printed-recibos';
  private readonly maxRecentRecibos = 3;
  private readonly recentRecibosSubject = new BehaviorSubject<RecentPrintedReciboItem[]>(this.loadRecentRecibos());

  readonly recentRecibos$ = this.recentRecibosSubject.asObservable();

  constructor(private establecimientoService: EstablecimientoService) {}

  getRecentRecibosSnapshot(): RecentPrintedReciboItem[] {
    return this.recentRecibosSubject.value;
  }

  registerRecentRecibo(
    recibo: {
      id: number;
      total?: number | null;
      fechaCreacion?: string | null;
      cliente?: { nombre?: string | null } | null;
    },
    detalles: PrintableReciboDetalle[],
    /** Si el recibo no trae `cliente` anidado (p. ej. historial), o como respaldo del tab del ticket. */
    clienteNombreAlternativo?: string | null,
    impresionExtra?: ReciboTicketImpresionExtra | null
  ): void {
    if (!recibo?.id || !detalles?.length) {
      return;
    }

    const sumaLineas = this.calculateTotal(detalles);
    const totalRegistrado = this.resolveTotalRegistro(recibo, sumaLineas);
    const nombreRecibo = this.normalizeClienteNombre(recibo.cliente?.nombre);
    const nombreTicket = this.normalizeClienteNombre(clienteNombreAlternativo);
    const clienteNombre = nombreRecibo ?? nombreTicket;

    const snapshot: RecentPrintedReciboItem = {
      reciboId: recibo.id,
      total: totalRegistrado,
      fechaCreacion: recibo.fechaCreacion ?? new Date().toISOString(),
      clienteNombre: clienteNombre ?? undefined,
      detalles: detalles.map((detalle) => ({
        productoId: detalle.productoId,
        cantidad: Number(detalle.cantidad ?? 0),
        subtotal: this.subtotalFromLine(detalle),
        producto: detalle.producto
          ? {
              nombre: detalle.producto.nombre,
              precio: detalle.producto.precio ?? null,
              precioUnidad: detalle.producto.precioUnidad ?? null
            }
          : null
      })),
      metodoPagoLabel: impresionExtra?.metodoPagoLabel ?? undefined,
      montoRecibido: impresionExtra?.montoRecibido ?? undefined,
      cambio: impresionExtra?.cambio ?? undefined,
      pagosLineas: impresionExtra?.pagosLineas?.length
        ? impresionExtra.pagosLineas.map((p) => ({ ...p }))
        : undefined
    };

    const nextItems = [
      snapshot,
      ...this.recentRecibosSubject.value.filter((item) => item.reciboId !== snapshot.reciboId)
    ].slice(0, this.maxRecentRecibos);

    this.persistRecentRecibos(nextItems);
  }

  printRecentRecibo(item: RecentPrintedReciboItem): boolean {
    if (!item?.detalles?.length) {
      return false;
    }

    return this.printRecibo({
      fechaCreacion: item.fechaCreacion,
      detalles: item.detalles,
      clienteNombre: item.clienteNombre ?? null,
      metodoPagoLabel: item.metodoPagoLabel ?? null,
      montoRecibido: item.montoRecibido ?? null,
      cambio: item.cambio ?? null,
      pagosLineas: item.pagosLineas ?? null
    });
  }

  printRecibo(options: ReciboImpresionOpciones): boolean {
    if (!options.detalles?.length) {
      return false;
    }

    const cuerpo = this.buildReciboHtmlFragment(options);
    const htmlCompleto = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Imprimir Recibo</title>
<style>
${ReciboPrintService.standalonePrintCss()}
</style>
<script>
window.onafterprint = function() {
  setTimeout(function() {
    window.close();
  }, 100);
};
window.onload = function() {
  setTimeout(function() {
    window.print();
  }, 250);
};
</script>
</head><body>${cuerpo}</body></html>`;

    const printerWindow = window.open('', '_blank');
    if (!printerWindow) {
      return false;
    }

    printerWindow.document.write(htmlCompleto);
    printerWindow.document.close();
    printerWindow.focus();
    return true;
  }

  /**
   * Convierte detalles de API a formato imprimible (incluye `precioUnidad` si existe).
   */
  toPrintableDetalles(
    detalles: Array<{
      productoId: number;
      cantidad: number;
      subtotal: number;
      producto?: {
        nombre: string;
        precio?: number | null;
        precioUnidad?: number | null;
      } | null;
    }>
  ): PrintableReciboDetalle[] {
    return detalles.map((d) => ({
      productoId: d.productoId,
      cantidad: Number(d.cantidad ?? 0),
      subtotal: this.subtotalFromLine(d),
      producto: d.producto
        ? {
            nombre: d.producto.nombre,
            precio: d.producto.precio ?? null,
            precioUnidad: d.producto.precioUnidad ?? null
          }
        : null
    }));
  }

  /**
   * HTML del cuerpo del recibo (misma marca que {@link printRecibo}).
   */
  buildReciboHtmlFromOpciones(options: ReciboImpresionOpciones): string {
    return this.buildReciboHtmlFragment(options);
  }

  /**
   * CSS para documento de impresión en ventana propia (ancho térmico 58 mm por defecto).
   * Debe coincidir con {@link ReciboPrintService.injectedPrintCss} para el mismo aspecto.
   */
  static standalonePrintCss(): string {
    const w = RECIBO_TICKET_WIDTH_MM;
    return `
@page { size: ${w}mm auto; margin: 0; }
/* Tirilla térmica: trazos más gruesos y menos “gris” que Courier suavizado; líneas sólidas mejor que punteado. */
html, body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  width: ${w}mm;
  max-width: ${w}mm;
  background: #fff;
  color: #000;
  color-scheme: only light;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
html {
  font-family: Consolas, 'Lucida Console', 'DejaVu Sans Mono', 'Courier New', Courier, monospace;
  font-size: 14px;
  font-weight: 600;
  text-rendering: optimizeSpeed;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: unset;
  text-shadow: none;
}
body { padding: 6px 4px; }
p, div, span { color: #000; text-shadow: none; }
.pos-titulo { text-align: center; font-weight: 700; font-size: 17px; margin: 0 0 4px 0; }
.pos-fecha, .pos-leyenda { text-align: center; margin: 2px 0; }
.pos-leyenda { font-size: 11px; font-weight: 600; }
.pos-sep-linea {
  border: none;
  border-top: 1px solid #000;
  margin: 8px 0;
  opacity: 1;
}
.pos-item { margin-bottom: 8px; }
.pos-item-linea1 { font-weight: 700; line-height: 1.25; }
.pos-item-linea2 {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
  padding-left: 2px;
  font-weight: 600;
}
.pos-fila-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 700;
  margin-top: 6px;
}
.pos-total-monto { font-size: 18px; font-weight: 800; }
.pos-fila-pago, .pos-fila-devolver {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
  font-weight: 600;
}
.pos-fila-pago-metodo { flex: 1; text-align: center; font-weight: 700; }
.pos-pie-linea { margin-top: 6px; font-weight: 600; }
@media print {
  html, body, .pos-recibo { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`.trim();
  }

  /**
   * CSS para recibo oculto en pantalla e impreso con el diálogo del documento principal.
   */
  static injectedPrintCss(printRootId: string): string {
    const w = RECIBO_TICKET_WIDTH_MM;
    return `
@page { size: ${w}mm auto; margin: 0; }
@media screen { #${printRootId} { display: none !important; } }
@media print {
  body * { visibility: hidden; }
  #${printRootId}, #${printRootId} * {
    visibility: visible !important;
    color: #000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #${printRootId} {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: ${w}mm !important;
    max-width: ${w}mm !important;
    display: block !important;
    box-sizing: border-box !important;
    font-family: Consolas, 'Lucida Console', 'DejaVu Sans Mono', 'Courier New', Courier, monospace !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    text-rendering: optimizeSpeed !important;
    -webkit-font-smoothing: none !important;
    text-shadow: none !important;
    color-scheme: only light !important;
    margin: 4px !important;
    padding: 0 !important;
  }
  #${printRootId} p, #${printRootId} div, #${printRootId} span { text-shadow: none !important; color: #000 !important; }
  #${printRootId} p { margin: 0.2rem 0 !important; }
  #${printRootId} .pos-titulo { text-align: center !important; font-weight: 700 !important; font-size: 17px !important; margin: 0 0 4px 0 !important; }
  #${printRootId} .pos-fecha, #${printRootId} .pos-leyenda { text-align: center !important; margin: 2px 0 !important; }
  #${printRootId} .pos-leyenda { font-size: 11px !important; font-weight: 600 !important; }
  #${printRootId} .pos-sep-linea { border: none !important; border-top: 1px solid #000 !important; margin: 8px 0 !important; opacity: 1 !important; }
  #${printRootId} .pos-item { margin-bottom: 8px !important; }
  #${printRootId} .pos-item-linea1 { font-weight: 700 !important; line-height: 1.25 !important; }
  #${printRootId} .pos-item-linea2 {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    gap: 8px !important;
    margin-top: 2px !important;
    padding-left: 2px !important;
    font-weight: 600 !important;
  }
  #${printRootId} .pos-fila-total {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    font-weight: 700 !important;
    margin-top: 6px !important;
  }
  #${printRootId} .pos-total-monto { font-size: 18px !important; font-weight: 800 !important; }
  #${printRootId} .pos-fila-pago, #${printRootId} .pos-fila-devolver {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    gap: 6px !important;
    margin-top: 4px !important;
    font-weight: 600 !important;
  }
  #${printRootId} .pos-fila-pago-metodo { flex: 1 !important; text-align: center !important; font-weight: 700 !important; }
  #${printRootId} .pos-pie-linea { margin-top: 6px !important; font-weight: 600 !important; }
}
`.trim();
  }

  formatCurrency(value: number | null | undefined): string {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return formatter.format(Number(value ?? 0)).replace('COP', '$').trim();
  }

  static toImpresionEstablecimiento(
    dto: EstablecimientoDto | null | undefined
  ): ReciboImpresionEstablecimiento | null {
    if (!dto?.razonSocial) {
      return null;
    }
    return {
      razonSocial: dto.razonSocial,
      nombreComercial: dto.nombreComercial ?? null,
      nit: dto.nit ?? null,
      digitoVerificacion: dto.digitoVerificacion ?? null,
      regimenTributario: dto.regimenTributario ?? null,
      regimenLeyendaImpresion: dto.regimenLeyendaImpresion ?? null,
      direccion: dto.direccion ?? null
    };
  }

  formatReciboFecha(fecha: string | Date | null | undefined): string {
    const date = fecha ? new Date(fecha) : new Date();
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'medium'
    });
  }

  private readAtendidoNombre(explicit?: string | null): string | null {
    const t = explicit?.trim();
    if (t) {
      return t;
    }
    try {
      return localStorage.getItem(LS_USER_NOMBRE)?.trim() || null;
    } catch {
      return null;
    }
  }

  private buildReciboHtmlFragment(opts: ReciboImpresionOpciones): string {
    const fechaHoraStr = opts.fechaEmision
      ? opts.fechaEmision.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' })
      : this.formatReciboFecha(opts.fechaCreacion);
    const total = this.calculateTotal(opts.detalles);
    const atendido = this.readAtendidoNombre(opts.atendidoNombre);
    const clienteEtiqueta = this.formatNombreEtiquetaTicket(opts.clienteNombre);
    const est =
      opts.establecimiento ??
      ReciboPrintService.toImpresionEstablecimiento(
        this.establecimientoService.getSnapshot()
      );
    const titulo =
      est?.nombreComercial?.trim() ||
      est?.razonSocial?.trim() ||
      'MI TIENDA POS';
    const leyendaRegimen =
      est?.regimenLeyendaImpresion?.trim() ||
      'Establecimiento NO RESPONSABLE DE IVA';
    const consecutivo = opts.documentoVentaConsecutivo?.trim() || null;

    const lineas: string[] = [];
    lineas.push('<div class="pos-recibo">');
    lineas.push(`<p class="pos-titulo">${this.escapeHtml(titulo)}</p>`);
    if (est?.razonSocial && est.razonSocial.trim() !== titulo) {
      lineas.push(
        `<p class="pos-leyenda">${this.escapeHtml(est.razonSocial.trim())}</p>`
      );
    }
    if (est?.nit?.trim()) {
      const dv = est.digitoVerificacion?.trim();
      const nitLine = dv ? `NIT ${est.nit.trim()}-${dv}` : `NIT ${est.nit.trim()}`;
      lineas.push(`<p class="pos-leyenda">${this.escapeHtml(nitLine)}</p>`);
    }
    lineas.push(`<p class="pos-fecha">${this.escapeHtml(fechaHoraStr)}</p>`);
    if (consecutivo) {
      lineas.push(
        `<p class="pos-leyenda">Doc. venta: ${this.escapeHtml(consecutivo)}</p>`
      );
    }
    lineas.push(`<p class="pos-leyenda">${this.escapeHtml(leyendaRegimen)}</p>`);
    lineas.push(
      '<p class="pos-leyenda">Documento de venta — no constituye factura electrónica</p>'
    );
    lineas.push('<hr class="pos-sep-linea"/>');

    for (const det of opts.detalles) {
      const st = this.subtotalFromLine(det);
      const nombre = det.producto?.nombre ?? `Producto ${det.productoId}`;
      const cant = Number(det.cantidad ?? 0);
      const cantTxt = Number.isInteger(cant) ? String(cant) : String(cant);
      const unitario = cant ? st / cant : Number(det.producto?.precio ?? 0);
      const sufijoUnidad = this.esVentaPorUnidadDetalle(det) ? ' (unidad)' : '';
      lineas.push('<div class="pos-item">');
      lineas.push(
        `<div class="pos-item-linea1">* ${this.escapeHtml(cantTxt)} x ${this.escapeHtml(nombre)}${sufijoUnidad}</div>`
      );
      lineas.push(
        '<div class="pos-item-linea2">',
        `<span>${this.formatCurrency(unitario)}</span>`,
        `<span>${this.formatCurrency(st)}</span>`,
        '</div>',
        '</div>'
      );
    }

    lineas.push('<hr class="pos-sep-linea"/>');
    lineas.push(
      '<div class="pos-fila-total">',
      '<span>TOTAL:</span>',
      `<span class="pos-total-monto">${this.formatCurrency(total)}</span>`,
      '</div>'
    );

    const pagosLineas = (opts.pagosLineas ?? []).filter(
      (p) => p && Number(p.monto) > 0 && (p.label ?? '').trim()
    );
    if (pagosLineas.length > 0) {
      for (const linea of pagosLineas) {
        lineas.push(
          '<div class="pos-fila-pago">',
          '<span>PAGO:</span>',
          `<span class="pos-fila-pago-metodo">${this.escapeHtml(linea.label.trim())}</span>`,
          `<span>${this.formatCurrency(linea.monto)}</span>`,
          '</div>'
        );
      }
    } else {
      const labelMetodo = (opts.metodoPagoLabel ?? '').trim();
      const tieneMontoPago =
        opts.montoRecibido != null && Number.isFinite(Number(opts.montoRecibido));
      if (labelMetodo || tieneMontoPago) {
        const metodoHtml = this.escapeHtml(labelMetodo || '—');
        const montoPagoStr = tieneMontoPago
          ? this.formatCurrency(opts.montoRecibido)
          : '';
        lineas.push(
          '<div class="pos-fila-pago">',
          '<span>PAGO:</span>',
          `<span class="pos-fila-pago-metodo">${metodoHtml}</span>`,
          `<span>${montoPagoStr}</span>`,
          '</div>'
        );
      }
    }

    const cambioVal = opts.cambio != null ? Number(opts.cambio) : null;
    if (cambioVal != null && Number.isFinite(cambioVal) && cambioVal > 0) {
      lineas.push(
        '<div class="pos-fila-devolver">',
        '<span>CAMBIO:</span>',
        `<span>${this.formatCurrency(cambioVal)}</span>`,
        '</div>'
      );
    }

    const credito = opts.creditoResumen;
    if (credito) {
      lineas.push('<hr class="pos-sep-linea"/>');
      lineas.push(
        '<div class="pos-fila-pago">',
        '<span>CREDITO:</span>',
        `<span>${this.formatCurrency(credito.creditoOriginal)}</span>`,
        '</div>'
      );
      lineas.push(
        '<div class="pos-fila-pago">',
        '<span>ABONO:</span>',
        `<span>${this.formatCurrency(credito.abonado)}</span>`,
        '</div>'
      );
      lineas.push(
        '<div class="pos-fila-pago">',
        '<span>SALDO:</span>',
        `<span>${this.formatCurrency(credito.saldoPendiente)}</span>`,
        '</div>'
      );
      const nota =
        (credito.nota ?? '').trim() ||
        'Tiene crédito pendiente por pagar.';
      lineas.push(
        `<p class="pos-pie-linea">${this.escapeHtml(nota)}</p>`
      );
    }

    lineas.push('<hr class="pos-sep-linea"/>');
    lineas.push(`<p class="pos-pie-linea">CLIENTE: ${this.escapeHtml(clienteEtiqueta)}</p>`);
    if (atendido) {
      lineas.push(`<p class="pos-pie-linea">ATENDIO: ${this.escapeHtml(atendido)}</p>`);
    }
    lineas.push('</div>');
    return lineas.join('');
  }

  private esVentaPorUnidadDetalle(det: PrintableReciboDetalle): boolean {
    const pu = det.producto?.precioUnidad;
    if (pu === null || pu === undefined || !Number.isFinite(Number(pu))) {
      return false;
    }
    const cant = Number(det.cantidad ?? 0);
    if (cant <= 0) {
      return false;
    }
    const unit = this.subtotalFromLine(det) / cant;
    return Math.abs(unit - Number(pu)) < 0.0001;
  }

  private calculateTotal(detalles: PrintableReciboDetalle[]): number {
    return detalles.reduce((sum, det) => sum + this.subtotalFromLine(det), 0);
  }

  /** Soporta distintas formas de payload (p. ej. PascalCase desde API). */
  private subtotalFromLine(detalle: unknown): number {
    if (detalle == null || typeof detalle !== 'object') {
      return 0;
    }
    const d = detalle as Record<string, unknown>;
    const raw = d['subtotal'] ?? d['Subtotal'] ?? d['subTotal'] ?? d['sub_total'];
    const n = Number(raw ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Prioriza la suma de subtotales de línea. No usar `recibo.total ?? suma`: si la API manda `total: 0`,
   * `??` no cae a la suma y el historial queda en 0.
   */
  /** Alineado con historial-ventas: no mostrar ANONIMO. */
  private normalizeClienteNombre(raw: string | null | undefined): string | null {
    const t = raw?.trim();
    if (!t) {
      return null;
    }
    if (t.toUpperCase() === 'ANONIMO') {
      return null;
    }
    return t;
  }

  private formatNombreEtiquetaTicket(raw?: string | null): string {
    const t = raw?.trim();
    if (!t || t.toUpperCase() === 'ANONIMO') {
      return 'Anonimo';
    }
    const max = 40;
    if (t.length <= max) {
      return t;
    }
    return `${t.slice(0, max - 3)}...`;
  }

  private resolveTotalRegistro(
    recibo: { total?: number | null },
    sumaLineas: number
  ): number {
    if (sumaLineas > 0) {
      return sumaLineas;
    }
    const raw = recibo.total;
    if (raw === undefined || raw === null) {
      return 0;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private loadRecentRecibos(): RecentPrintedReciboItem[] {
    try {
      const raw = localStorage.getItem(this.recentRecibosStorageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.slice(0, this.maxRecentRecibos);
    } catch {
      return [];
    }
  }

  private persistRecentRecibos(items: RecentPrintedReciboItem[]): void {
    localStorage.setItem(this.recentRecibosStorageKey, JSON.stringify(items));
    this.recentRecibosSubject.next(items);
  }
}
