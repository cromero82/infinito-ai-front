import { MetodoPagoDto } from '../../../ventas/service/metodo-pago.service';

/** Etiqueta de origen de pago en egresos (usa descripcion_egreso del catálogo). */
export function etiquetaMetodoPagoEgreso(
  metodo: MetodoPagoDto | null | undefined
): string {
  if (!metodo) {
    return '—';
  }
  const etiqueta = metodo.descripcionEgreso?.trim();
  if (etiqueta) {
    return etiqueta;
  }
  return metodo.descripcion;
}

export function etiquetaMetodoPagoEgresoPorId(
  metodoPagoId: number | null | undefined,
  metodos: MetodoPagoDto[]
): string {
  if (metodoPagoId == null) {
    return '—';
  }
  const metodo = metodos.find((m) => m.id === metodoPagoId);
  return etiquetaMetodoPagoEgreso(metodo);
}
