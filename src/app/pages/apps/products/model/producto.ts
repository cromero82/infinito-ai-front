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
  precioCompra?: number;
  foto?: string;
  company?: Company;
  activate?: number;
  fechaUltimaActualizacionPrecio?: string | null;
  fechaCreacion?: string | null;
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
