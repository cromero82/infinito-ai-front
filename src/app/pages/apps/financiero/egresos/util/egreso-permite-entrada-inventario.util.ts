import { EgresoDto } from '../service/egresos.service';

/** Entrada almacén solo para tipos cuyo nombre incluye "compra" y "proveedor". */
export function egresoPermiteEntradaInventario(
  egreso: Pick<EgresoDto, 'proveedor'> | null | undefined
): boolean {
  const nombre = egreso?.proveedor?.tipoEgreso?.nombre?.toLowerCase() ?? '';
  return nombre.includes('compra') && nombre.includes('proveedor');
}
