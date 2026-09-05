/** Umbral en pesos para considerar diferencia (alineado al cierre). */
export const CIERRE_DESFASE_EPS = 1;

export function tieneDesfaseCierre(
  desfase: number,
  eps = CIERRE_DESFASE_EPS
): boolean {
  return Number.isFinite(desfase) && Math.abs(desfase) >= eps;
}

export function claseDesfaseCierre(desfase: number): string {
  if (!tieneDesfaseCierre(desfase)) {
    return 'desfase-ok';
  }
  return desfase > 0 ? 'desfase-mas' : 'desfase-menos';
}

export function textoDesfaseCierre(
  desfase: number,
  formatCurrency: (value: number) => string
): string {
  if (!tieneDesfaseCierre(desfase)) {
    return 'Sin diferencia';
  }
  const monto = formatCurrency(Math.abs(desfase));
  return desfase > 0 ? `Sobra dinero ${monto}` : `Falta dinero ${monto}`;
}
