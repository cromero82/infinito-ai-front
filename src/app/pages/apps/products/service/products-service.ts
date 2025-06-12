import { Injectable } from '@angular/core';

export interface Producto {
  barcode: string;
  nombre: string;
  precio: number;
  foto: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  constructor() {}

  obtenerProductos(): Producto[] {
    return [
      {
        barcode: '7501000123456',
        nombre: 'Leche Entera',
        precio: 22.5,
        foto: 'assets/img/demo/leche.jpg'
      },
      {
        barcode: '7501000654321',
        nombre: 'Pan Integral',
        precio: 18.0,
        foto: 'assets/img/demo/pan.jpg'
      },
      {
        barcode: '7501000789123',
        nombre: 'Queso Manchego',
        precio: 55.0,
        foto: 'assets/img/demo/queso.jpg'
      },
      {
        barcode: '7501000456789',
        nombre: 'Jamon de Pavo',
        precio: 40.0,
        foto: 'assets/img/demo/jamon.jpg'
      },
      {
        barcode: '7501000987654',
        nombre: 'Yogur Natural',
        precio: 12.5,
        foto: 'assets/img/demo/yogur.jpg'
      },
      {
        barcode: '7501000234567',
        nombre: 'Cereal de Maíz',
        precio: 30.0,
        foto: 'assets/img/demo/cereal.jpg'
      },
      {
        barcode: '7501000345678',
        nombre: 'Jugo de Naranja',
        precio: 25.0,
        foto: 'assets/img/demo/jugo.jpg'
      },
      {
        barcode: '7501000567890',
        nombre: 'Galletas de Avena',
        precio: 15.0,
        foto: 'assets/img/demo/galletas.jpg'
      },
      {
        barcode: '7501000678901',
        nombre: 'Mantequilla',
        precio: 28.0,
        foto: 'assets/img/demo/mantequilla.jpg'
      },
      {
        barcode: '7501000789012',
        nombre: 'Refresco Cola',
        precio: 16.0,
        foto: 'assets/img/demo/refresco.jpg'
      },
      {
        barcode: '7501000890123',
        nombre: 'Agua Embotellada',
        precio: 10.0,
        foto: 'assets/img/demo/agua.jpg'
      },
      {
        barcode: '7501000901234',
        nombre: 'Aceite Vegetal',
        precio: 35.0,
        foto: 'assets/img/demo/aceite.jpg'
      },
      {
        barcode: '7501001012345',
        nombre: 'Arroz Blanco',
        precio: 20.0,
        foto: 'assets/img/demo/arroz.jpg'
      },
      {
        barcode: '7501001123456',
        nombre: 'Frijol Negro',
        precio: 22.0,
        foto: 'assets/img/demo/frijol.jpg'
      },
      {
        barcode: '7501001234567',
        nombre: 'Azúcar Morena',
        precio: 18.5,
        foto: 'assets/img/demo/azucar.jpg'
      },
      {
        barcode: '7501001345678',
        nombre: 'Sal de Mesa',
        precio: 8.0,
        foto: 'assets/img/demo/sal.jpg'
      },
      {
        barcode: '7501001456789',
        nombre: 'Café Molido',
        precio: 45.0,
        foto: 'assets/img/demo/cafe.jpg'
      },
      {
        barcode: '7501001567890',
        nombre: 'Té Verde',
        precio: 26.0,
        foto: 'assets/img/demo/te.jpg'
      },
      {
        barcode: '7501001678901',
        nombre: 'Huevos',
        precio: 36.0,
        foto: 'assets/img/demo/huevos.jpg'
      },
      {
        barcode: '7501001789012',
        nombre: 'Pollo Entero',
        precio: 80.0,
        foto: 'assets/img/demo/pollo.jpg'
      }
    ];
  }
}
