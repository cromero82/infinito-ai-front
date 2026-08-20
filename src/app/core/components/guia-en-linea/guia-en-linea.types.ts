export interface GuiaEnLineaTarget {
  /** Elemento DOM o selector CSS. */
  el: HTMLElement | string;
  /** Etiqueta opcional sobre el resaltado. */
  etiqueta?: string;
}

export interface GuiaEnLineaConfig {
  /** Texto principal de la ayuda. */
  mensaje: string;
  /** Título corto opcional. */
  titulo?: string;
  /** Elementos “origen” a sombrear (p. ej. métodos de pago). */
  origenes?: GuiaEnLineaTarget[];
  /** Elemento “destino” a sombrear y al que apunta la flecha. */
  destino: GuiaEnLineaTarget;
  /** Texto del botón de cierre. */
  cerrarLabel?: string;
  /** Callback al cerrar. */
  onCerrar?: () => void;
}
