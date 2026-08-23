import { EgresoDto } from '../service/egresos.service';

/** Entrada almacén: tipo del egreso (snapshot); fallback al tipo del proveedor. */
export function egresoPermiteEntradaInventario(
  egreso: Pick<EgresoDto, 'tipoEgreso' | 'proveedor'> | null | undefined
): boolean {
  const nombre =
    egreso?.tipoEgreso?.nombre?.toLowerCase() ??
    egreso?.proveedor?.tipoEgreso?.nombre?.toLowerCase() ??
    '';
  return nombre.includes('compra') && nombre.includes('proveedor');
}
