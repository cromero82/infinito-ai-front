import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PrintableReciboDetalle {
  productoId: number;
  cantidad: number;
  subtotal: number;
  producto?: {
    nombre: string;
    precio?: number | null;
  } | null;
}

export interface RecentPrintedReciboItem {
  reciboId: number;
  total: number;
  fechaCreacion: string;
  /** Nombre para mostrar si el ticket/recibo tiene cliente (no ANONIMO). */
  clienteNombre?: string | null;
  detalles: PrintableReciboDetalle[];
}

interface PrintReciboOptions {
  fechaCreacion?: string | Date | null;
  detalles: PrintableReciboDetalle[];
  /** Nombre tal cual viene del recibo/ticket; vacío o ANONIMO → "Cliente: Anonimo". */
  clienteNombre?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReciboPrintService {
  private readonly recentRecibosStorageKey = 'recent-printed-recibos';
  private readonly maxRecentRecibos = 3;
  private readonly recentRecibosSubject = new BehaviorSubject<RecentPrintedReciboItem[]>(this.loadRecentRecibos());

  readonly recentRecibos$ = this.recentRecibosSubject.asObservable();

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
    clienteNombreAlternativo?: string | null
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
              precio: detalle.producto.precio ?? null
            }
          : null
      }))
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
      clienteNombre: item.clienteNombre ?? null
    });
  }

  printRecibo(options: PrintReciboOptions): boolean {
    if (!options.detalles?.length) {
      return false;
    }

    const cuerpo = this.buildReciboHtmlFragment(
      options.detalles,
      options.fechaCreacion,
      options.clienteNombre
    );
    const htmlCompleto = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Imprimir Recibo</title>
<style>
@page {
  size: 80mm auto;
  margin: 0;
}
html{padding:0;margin:0;font-family:'Courier New','Courier',monospace;width:80mm;font-size:12px}
body{margin:0;padding:8px;width:80mm;background:white}
p{margin-top:0.25rem;margin-bottom:0.25rem;white-space:pre-wrap}
.pos-titulo{text-align:center;font-weight:bold;font-size:14px;margin:0 0 4px 0}
.pos-fecha,.pos-leyenda{text-align:center;margin:2px 0}
.pos-leyenda{font-size:10px}
.pos-sep{border:none;border-top:1px dashed #000;margin:6px 0}
.pos-tabla{width:100%;border-collapse:collapse;font-size:11px}
.pos-tabla th{text-align:left;border-bottom:1px solid #000;padding:2px 4px}
.pos-tabla td{padding:2px 4px}
.pos-total{font-weight:bold;text-align:right;margin-top:4px;font-size:14px}
.pos-cliente{font-size:11px;margin-top:8px;text-align:left}
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

  formatCurrency(value: number | null | undefined): string {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return formatter.format(Number(value ?? 0)).replace('COP', '$').trim();
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

  /**
   * Línea final del ticket impreso: `Cliente: Anonimo` o `Cliente: Nombre...` (truncado).
   */
  lineaClienteTicketHtml(clienteNombreRaw?: string | null): string {
    const etiqueta = this.formatNombreEtiquetaTicket(clienteNombreRaw);
    return `<p class="pos-cliente">Cliente: ${this.escapeHtml(etiqueta)}</p>`;
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

  private buildReciboHtmlFragment(
    detalles: PrintableReciboDetalle[],
    fechaCreacion?: string | Date | null,
    clienteNombreRaw?: string | null
  ): string {
    const fechaHoraStr = this.formatReciboFecha(fechaCreacion);
    const total = this.calculateTotal(detalles);
    const lineas: string[] = [];

    lineas.push('<div class="pos-recibo">');
    lineas.push('<p class="pos-titulo">Gestor infinito market</p>');
    lineas.push(`<p class="pos-fecha">${this.escapeHtml(fechaHoraStr)}</p>`);
    lineas.push('<p class="pos-leyenda">Recibo no apto como factura</p>');
    lineas.push('<hr class="pos-sep"/>');
    lineas.push('<table class="pos-tabla"><thead><tr><th>Producto</th><th>V.Unit</th><th>Cant</th><th>Subtotal</th></tr></thead><tbody>');

    for (const det of detalles) {
      const st = this.subtotalFromLine(det);
      const nombre = det.producto?.nombre ?? `Producto ${det.productoId}`;
      const unitario = det.cantidad ? st / Number(det.cantidad) : Number(det.producto?.precio ?? 0);
      lineas.push(
        '<tr>',
        `<td>${this.escapeHtml(nombre)}</td>`,
        `<td>${this.formatCurrency(unitario)}</td>`,
        `<td>${det.cantidad}</td>`,
        `<td>${this.formatCurrency(st)}</td>`,
        '</tr>'
      );
    }

    lineas.push(
      '</tbody></table>',
      '<hr class="pos-sep"/>',
      `<p class="pos-total">TOTAL: ${this.formatCurrency(total)}</p>`,
      this.lineaClienteTicketHtml(clienteNombreRaw),
      '</div>'
    );
    return lineas.join('');
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
