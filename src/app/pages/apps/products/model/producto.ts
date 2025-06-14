export interface Company {
  id: number;
  name: string;
  description: string;
  email: string;
  telefono: string;
  contactName: string;
}

export interface Producto {
  barcode: string;
  nombre: string;
  precio: number;
  foto: string;
  company?: Company;
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
