import { Producto } from '../../productos/model/producto';
import { isLikelyProductBarcodeDigits } from './barcode-scan.util';

/**
 * Por nombre: primero los que empiezan por el término, luego totalVentas desc.
 * Por código de barras no se reordena por prefijo de nombre.
 */
export function ordenarResultadosSelectorProductos(
  items: Producto[],
  term: string
): Producto[] {
  const q = term.trim().toLowerCase();
  const porNombre = q.length > 0 && !isLikelyProductBarcodeDigits(term);
  return [...items].sort((a, b) => {
    if (porNombre) {
      const aPrefijo = (a.nombre ?? '').toLowerCase().startsWith(q);
      const bPrefijo = (b.nombre ?? '').toLowerCase().startsWith(q);
      if (aPrefijo !== bPrefijo) {
        return aPrefijo ? -1 : 1;
      }
    }
    const ventasDiff = (b.totalVentas ?? 0) - (a.totalVentas ?? 0);
    if (ventasDiff !== 0) {
      return ventasDiff;
    }
    return (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es', {
      sensitivity: 'base'
    });
  });
}
