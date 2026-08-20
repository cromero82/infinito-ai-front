import { OrigenFondosArbolItemDto } from './origen-fondos-arbol.util';
import { sugerirClasificacionDesdeOf } from './clasificacion-operativa.util';

/**
 * Reglas de traslado entre orígenes de fondos:
 * 1. Medio electrónico: desde un hijo (p.ej. Sin Clasificar) hacia cualquier padre no electrónico
 *    (Caja Efectivo / Menor / General). También raíz electrónica → esos padres.
 * 2–3. No electrónico: entre padres físicos y entre padres e hijos físicos.
 * El árbol electrónico interno (padre/hermanos) sigue permitido.
 */
export function esMedioElectronico(
  of: OrigenFondosArbolItemDto | null | undefined,
  arbol: OrigenFondosArbolItemDto[]
): boolean {
  if (!of) {
    return false;
  }
  const nat = (of.naturaleza || '').toUpperCase();
  if (nat === 'ELECTRONICA') {
    return true;
  }
  if (nat === 'FISICA') {
    return false;
  }
  const nombre = (of.nombre || '').toLowerCase();
  if (nombre.includes('caja') || nombre.includes('efectivo')) {
    return false;
  }
  if (of.parentOrigenFondosId) {
    const padre = arbol.find((c) => c.id === of.parentOrigenFondosId);
    if (padre && padre.id !== of.id) {
      return esMedioElectronico(padre, arbol);
    }
  }
  return of.metodoPagoId != null;
}

export function esPadreOf(of: OrigenFondosArbolItemDto): boolean {
  return (
    of.esRaiz === true ||
    of.nivel === 0 ||
    of.parentOrigenFondosId == null ||
    of.parentOrigenFondosId <= 0
  );
}

export function esHijoOf(of: OrigenFondosArbolItemDto): boolean {
  return !esPadreOf(of);
}

export function puedeTrasladarEntreOf(
  origen: OrigenFondosArbolItemDto,
  destino: OrigenFondosArbolItemDto,
  arbol: OrigenFondosArbolItemDto[]
): boolean {
  if (!origen || !destino || origen.id === destino.id) {
    return false;
  }
  const origElec = esMedioElectronico(origen, arbol);
  const destElec = esMedioElectronico(destino, arbol);

  if (origElec) {
    if (!destElec && esPadreOf(destino)) {
      return true;
    }
    if (sugerirClasificacionDesdeOf(destino.nombre) === 'CUENTA_PERSONAL') {
      return true;
    }
    if (esHijoOf(origen)) {
      const padreId = origen.parentOrigenFondosId!;
      if (destino.id === padreId) {
        return true;
      }
      if (destino.parentOrigenFondosId === padreId) {
        return true;
      }
    }
    return false;
  }

  return !destElec;
}

export function destinosPermitidosTraslado(
  origen: OrigenFondosArbolItemDto,
  arbol: OrigenFondosArbolItemDto[]
): OrigenFondosArbolItemDto[] {
  return arbol.filter((d) => puedeTrasladarEntreOf(origen, d, arbol));
}
