import { GrupoEspejoEnProducto } from './grupo-espejo';

export interface Company {
  id: number;
  name: string;
  description: string;
  email: string;
  telefono: string;
  contactName: string;
}

export interface Producto {
  id?: number;
  barcode: string;
  nombre: string;
  precio: number;
  precioUnidad?: number | null;
  precioCompra?: number;
  foto?: string;
  company?: Company;
  activate?: number;
  fechaUltimaActualizacionPrecio?: string | null;
  fechaCreacion?: string | null;
  fecha_ultima_venta?: string | null;
  porcentaje_ganancia?: number | null;
  porcentajeGanancia?: number | null;
  existencia?: number;
  totalVentas?: number;
  /** Grupo espejo (mismo producto en distintas presentaciones); null si no aplica */
  grupoEspejo?: GrupoEspejoEnProducto | null;
  /** UoM vendibles (PAQUETE / UNIDAD / …) cuando el API las envía. */
  presentaciones?: Array<{
    id: number;
    codigo: string;
    nombreMostrar: string;
    factorABase: number;
    precioVenta: number;
    esDefaultVenta?: boolean;
    codigoBarrasAlt?: string | null;
  }>;
}

export interface ProductPage {
  content: Producto[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  empty: boolean;
}

/** Respuesta de busquedaPorFiltros: page envuelve la paginación, percentFromTotal en raíz */
export interface BusquedaPorFiltrosResponse {
  page: ProductPage;
  percentFromTotal?: number;
}
