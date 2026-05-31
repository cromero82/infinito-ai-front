/** Umbral: por debajo se mantiene el % de ganancia actual; arriba delta compra + 5 %. */
export const UMBRAL_GANANCIA_AJUSTE = 50;

/** Extra sobre el delta de compra cuando la ganancia nueva es >= umbral. */
export const EXTRA_DELTA_COMPRA_RATIO = 1.05;

export function calcGananciaPct(
  precioVenta: number,
  precioCompra: number
): number | null {
  if (
    precioVenta <= 0 ||
    precioCompra <= 0 ||
    !Number.isFinite(precioVenta) ||
    !Number.isFinite(precioCompra)
  ) {
    return null;
  }
  return ((precioVenta - precioCompra) / precioCompra) * 100;
}

/**
 * Redondea a múltiplo de $100 sin restos de $50.
 */
export function ajustarPrecioVentaCOP(
  raw: number,
  subioPrecioCompra = true
): number {
  if (!raw || raw <= 0 || !Number.isFinite(raw)) {
    return 0;
  }
  const entero = Math.round(raw);
  if (entero % 100 === 0) {
    return entero;
  }
  if (subioPrecioCompra) {
    return Math.ceil(entero / 100) * 100;
  }
  return Math.max(100, Math.floor(entero / 100) * 100);
}

export type ModoAjustePrecioVenta = 'mantener_margen' | 'delta_mas_cinco';

/**
 * - Ganancia nueva (con venta actual y compra nueva) < 50 %:
 *   sube venta para mantener el mismo % de ganancia actual.
 * - Ganancia nueva >= 50 %:
 *   venta actual + (delta compra × 1,05), luego redondeo comercial.
 */
export function calcularPrecioVentaAjustado(
  precioVentaActual: number,
  precioCompraAnterior: number,
  precioCompraNuevo: number,
  gananciaActualPct: number | null
): { precio: number; modo: ModoAjustePrecioVenta; deltaVenta: number } {
  if (precioVentaActual <= 0) {
    return { precio: 0, modo: 'delta_mas_cinco', deltaVenta: 0 };
  }
  if (precioCompraAnterior <= 0 || precioCompraNuevo <= 0) {
    const p = ajustarPrecioVentaCOP(precioVentaActual);
    return { precio: p, modo: 'delta_mas_cinco', deltaVenta: p - precioVentaActual };
  }

  const gananciaNuevaPct = calcGananciaPct(
    precioVentaActual,
    precioCompraNuevo
  );
  const deltaCompra = precioCompraNuevo - precioCompraAnterior;
  const subioCompra = deltaCompra >= 0;

  if (gananciaNuevaPct != null && gananciaNuevaPct < UMBRAL_GANANCIA_AJUSTE) {
    const margen =
      gananciaActualPct != null
        ? gananciaActualPct / 100
        : (precioVentaActual - precioCompraAnterior) / precioCompraAnterior;
    const raw = precioCompraNuevo * (1 + margen);
    const precio = ajustarPrecioVentaCOP(raw, subioCompra);
    return {
      precio,
      modo: 'mantener_margen',
      deltaVenta: precio - precioVentaActual
    };
  }

  const deltaConExtra = deltaCompra * EXTRA_DELTA_COMPRA_RATIO;
  const raw = precioVentaActual + deltaConExtra;
  const precio = ajustarPrecioVentaCOP(raw, subioCompra);
  return {
    precio,
    modo: 'delta_mas_cinco',
    deltaVenta: precio - precioVentaActual
  };
}

/** Delta en pesos del precio de compra (nuevo − anterior). */
export function deltaPrecioCompraPesos(
  precioCompraAnterior: number,
  precioCompraNuevo: number
): number {
  return precioCompraNuevo - precioCompraAnterior;
}

/**
 * Venta para conservar el mismo % de ganancia actual sobre la compra nueva.
 * Ej.: 66,7 % sobre 2581 → ~4303 → redondeo comercial.
 */
export function calcularPrecioVentaMantenerMargen(
  precioVentaActual: number,
  precioCompraNuevo: number,
  gananciaActualPct: number | null,
  precioCompraAnterior?: number | null
): { precio: number; deltaVenta: number } {
  if (precioCompraNuevo <= 0 || precioVentaActual <= 0) {
    return { precio: precioVentaActual, deltaVenta: 0 };
  }

  let margen: number | null = null;
  if (gananciaActualPct != null && Number.isFinite(gananciaActualPct)) {
    margen = gananciaActualPct / 100;
  } else if (precioCompraAnterior != null && precioCompraAnterior > 0) {
    margen = (precioVentaActual - precioCompraAnterior) / precioCompraAnterior;
  }

  if (margen == null) {
    return { precio: precioVentaActual, deltaVenta: 0 };
  }

  const raw = precioCompraNuevo * (1 + margen);
  const subio = raw >= precioVentaActual;
  const precio = ajustarPrecioVentaCOP(raw, subio);
  return { precio, deltaVenta: precio - precioVentaActual };
}
