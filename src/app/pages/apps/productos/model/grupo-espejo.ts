/** Referencia embebida en Producto (búsqueda / consulta) */
export interface GrupoEspejoEnProducto {
  id: number;
  nombre: string;
}

/** Producto dentro de un grupo espejo (respuesta de listado de grupos) */
export interface GrupoEspejoProductoItem {
  id: number;
  nombre: string;
  precio?: number;
  precioCompra?: number;
  precioUnidad?: number;
  porcentajeGanancia?: number;
  fechaUltimaActualizacionPrecio?: string | null;
}

/** Grupo espejo (listado / detalle en búsqueda) */
export interface GrupoEspejoDto {
  id: number;
  nombre: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  productoReferenciaId: number;
  productos?: GrupoEspejoProductoItem[];
}

export interface CrearGrupoEspejoRequest {
  nombre: string;
  productoIds: number[];
}

/** Actualizar metadatos del grupo (p. ej. nombre) */
export interface ActualizarGrupoEspejoRequest {
  nombre: string;
}
