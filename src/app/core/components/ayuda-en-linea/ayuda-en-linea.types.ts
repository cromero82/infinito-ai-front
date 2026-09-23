export interface AyudaEnLineaAccion {
  titulo: string;
  detalle: string;
}

export interface AyudaEnLineaContenido {
  /** Título de la ventana (p. ej. nombre de la pantalla). */
  titulo: string;
  /** Resumen que también suele ir a la barra de estado. */
  resumen: string;
  /** Texto legado / tips (p. ej. antigua «Sugerencia»). */
  tips?: string[];
  /** Acciones o tareas que se pueden hacer en la pantalla. */
  acciones: AyudaEnLineaAccion[];
}
