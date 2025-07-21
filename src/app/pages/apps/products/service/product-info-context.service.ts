// filepath: src/app/pages/apps/products/service/product-info-context.service.ts

import { Injectable } from '@angular/core';
import { ProductInfoStrategy } from './product-info-strategy';
import { OpenFoodFactsSite } from './product-info-strategy';
import { ExitoStore } from './product-info-strategy';
import { OlimpicaStore } from './product-info-strategy';

@Injectable({ providedIn: 'root' })
export class ProductInfoContextService {
  private strategy: ProductInfoStrategy;

  constructor(
    private openFoodFacts: OpenFoodFactsSite,
    private exitoStore: ExitoStore,
    private olimpicaStore: OlimpicaStore
  ) {
    // Default strategy
    this.strategy = openFoodFacts;
  }

  setStrategy(strategy: ProductInfoStrategy) {
    this.strategy = strategy;
  }

  getProduct(barcode: string) {
    return this.strategy.getProduct(barcode);
  }

  searchProduct(nameReference: string) {
    return this.strategy.searchProduct(nameReference);
  }
}
