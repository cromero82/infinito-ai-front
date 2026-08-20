/**
 * Clasificación operativa del ledger (mismo contrato que legalizar email / SQL 38).
 * OF = dónde está la plata; clasificación = qué es para el negocio.
 */

export const CLASIFICACIONES_OPERATIVAS: { value: string; label: string }[] = [
  { value: 'CUENTA_PERSONAL', label: 'Cuenta personal / dueño' },
  { value: 'ANTICIPO_SALARIO', label: 'Anticipo de salario' },
  { value: 'VALE_EMPLEADO', label: 'Vale / préstamo empleado' },
  { value: 'GASTO_NEGOCIO', label: 'Gasto del negocio' },
  { value: 'OTRO_LEGALIZADO', label: 'Otro (legalizado)' }
];

export function labelClasificacionOperativa(
  codigo: string | null | undefined
): string {
  if (!codigo) {
    return '—';
  }
  return (
    CLASIFICACIONES_OPERATIVAS.find((c) => c.value === codigo)?.label || codigo
  );
}

/** Infiere clasificación sugerida según el OF destino (nombre). */
export function sugerirClasificacionDesdeOf(
  nombreOf: string | null | undefined
): string | null {
  const n = (nombreOf || '').toLowerCase();
  if (!n) {
    return null;
  }
  if (
    n.includes('cuenta del dueño') ||
    n.includes('cuenta del dueno') ||
    n.includes('personal admin') ||
    (n.includes('dueño') && !n.includes('dueños') && !n.includes('duenos'))
  ) {
    return 'CUENTA_PERSONAL';
  }
  if (n.includes('nómina') || n.includes('nomina') || n.includes('vale')) {
    return 'ANTICIPO_SALARIO';
  }
  if (
    n.includes('arriendo') ||
    n.includes('gasto') ||
    n.includes('proveedor') ||
    n.includes('insumo')
  ) {
    return 'GASTO_NEGOCIO';
  }
  if (n.includes('dueños') || n.includes('duenos') || n.includes('no operativo')) {
    return 'CUENTA_PERSONAL';
  }
  return null;
}
