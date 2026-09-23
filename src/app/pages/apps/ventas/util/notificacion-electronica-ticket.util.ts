/** Etiquetas de estado HRE en listados de tickets. */
export function labelNotificacionElectronica(
  estado: string | null | undefined
): string | null {
  if (!estado) {
    return null;
  }
  return estado.toUpperCase() === 'CONFIRMADA'
    ? 'Con notificación'
    : 'Pendiente';
}

export function esNotificacionConfirmada(
  estado: string | null | undefined
): boolean {
  return (estado ?? '').toUpperCase() === 'CONFIRMADA';
}
