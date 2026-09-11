/** Código de naturaleza en egreso (= naturaleza_tipo_egreso.codigo). */
export type NaturalezaEgreso =
  | 'COMPRA_MERCANCIA'
  | 'GASTO_OPERATIVO'
  | 'PERSONAL'
  | 'DIVIDENDOS'
  | 'TRIBUTO'
  | 'OTRO'
  | string;

/** Fallback de etiquetas si el catálogo aún no cargó. */
export const NATURALEZAS_EGRESO_FALLBACK: Array<{ value: string; label: string }> = [
  { value: 'COMPRA_MERCANCIA', label: 'Compra mercancía' },
  { value: 'GASTO_OPERATIVO', label: 'Gasto operativo' },
  { value: 'PERSONAL', label: 'Personal / nómina / anticipo' },
  { value: 'DIVIDENDOS', label: 'Dividendos / distribución' },
  { value: 'TRIBUTO', label: 'Tributo / impuestos' },
  { value: 'OTRO', label: 'Otro' }
];

export function labelNaturalezaEgreso(
  value: string | null | undefined,
  catalog?: Array<{ codigo: string; nombre: string }>
): string {
  if (!value) {
    return '—';
  }
  const fromCat = catalog?.find((n) => n.codigo === value);
  if (fromCat) {
    return fromCat.nombre;
  }
  const found = NATURALEZAS_EGRESO_FALLBACK.find((n) => n.value === value);
  return found?.label ?? value;
}

/** Sugiere naturaleza desde el tipo de catálogo (relación BD), no por heurística de nombre. */
export function naturalezaCodigoFromTipo(tipo: {
  naturaleza?: { codigo?: string | null } | null;
} | null | undefined): string | null {
  const codigo = tipo?.naturaleza?.codigo?.trim();
  return codigo ? codigo.toUpperCase() : null;
}

/** PERSONAL / DIVIDENDOS habilitan Cuenta del dueño si el beneficiario es persona dueño. */
export function esNaturalezaPersona(
  naturaleza: string | null | undefined
): boolean {
  const n = (naturaleza || '').trim().toUpperCase();
  return n === 'PERSONAL' || n === 'DIVIDENDOS';
}
