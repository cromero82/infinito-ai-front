import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExitoStore, OlimpicaStore } from '../service/product-info-strategy';
import { ProductInfo } from '../model/product-info.model';
import { Observable, forkJoin } from 'rxjs';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { GapAnalysisDialogComponent } from './gap-analysis-dialog.component';

@Component({
  selector: 'vex-product-price-comparator',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule, NgIf, NgClass, NgFor, FormsModule, DecimalPipe, CurrencyPipe, MatTooltipModule,
    GapAnalysisDialogComponent
  ],
  providers: [CurrencyPipe, DecimalPipe],
  templateUrl: './product-price-comparator.component.html',
  styleUrls: ['./product-price-comparator.component.scss']
})
export class ProductPriceComparatorComponent implements OnInit {
  openFoodProduct: any;
  exitoProduct: ProductInfo | null = null;
  olimpicaProduct: ProductInfo | null = null;
  loading: boolean = true;
  suggestedPrice: string = '';
  selectedSource: 'olimpica' | 'exito' | 'suggested' | null = null;

  // Name selection logic
  availableNames: Array<{ label: string; value: string; source: string }> = []; // Populated in ngOnInit
  selectedNameSource: 'olimpica' | 'exito' | 'openfoodfacts' | null = null;

  // GAP analysis logic
  showGapTooltip = false;
  showGapTooltipOlimpica = false;
  showGapTooltipExito = false;
  gapAnalysis: any = null;

  constructor(
    public dialogRef: MatDialogRef<ProductPriceComparatorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private exitoStore: ExitoStore,
    private olimpicaStore: OlimpicaStore,
    private currencyPipe: CurrencyPipe,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Prepare openFoodProduct from incoming data
    const product = this.data.product;
    this.openFoodProduct = {
      nombre: product.product_name || product.generic_name || '',
      type: (product.categories || '').split(',')[0]?.trim() || '',
      company: (product.brands || '').split(',')[0]?.trim() || '',
      image: product.image_url || ''
    };
    // Fetch from Exito and Olimpica in parallel
    const code = this.data.barcode;
    forkJoin({
      exito: this.exitoStore.getProduct(code),
      olimpica: this.olimpicaStore.getProduct(code)
    }).subscribe({
      next: ({ exito, olimpica }) => {
        this.exitoProduct = exito;
        this.olimpicaProduct = olimpica;
        // Default selection logic for image
        if (olimpica?.product?.image_url) {
          this.selectedSource = 'olimpica';
        } else if (exito?.product?.image_url) {
          this.selectedSource = 'exito';
        } else if (this.openFoodProduct?.image) {
          this.selectedSource = 'suggested';
        } else {
          this.selectedSource = null;
        }
        // Prepare available names
        this.availableNames = [];
        const openfoodName = this.openFoodProduct?.nombre?.trim();
        const exitoName = exito?.product?.product_name?.trim();
        const olimpicaName = olimpica?.product?.product_name?.trim();
        if (olimpicaName && (!openfoodName || olimpicaName !== openfoodName) && (!exitoName || olimpicaName !== exitoName)) {
          this.availableNames.push({ label: 'Nombre producto Olimpica', value: olimpicaName, source: 'olimpica' });
        }
        if (exitoName && (!openfoodName || exitoName !== openfoodName)) {
          this.availableNames.push({ label: 'Nombre producto Exito', value: exitoName, source: 'exito' });
        }
        if (openfoodName) {
          this.availableNames.unshift({ label: 'Nombre producto OpenFoodFacts', value: openfoodName, source: 'openfoodfacts' });
        }
        // Default name selection: prefer OpenFoodFacts, then Olimpica, then Exito
        if (openfoodName) {
          this.selectedNameSource = 'openfoodfacts';
        } else if (olimpicaName) {
          this.selectedNameSource = 'olimpica';
        } else if (exitoName) {
          this.selectedNameSource = 'exito';
        } else {
          this.selectedNameSource = null;
        }
        this.loading = false;
      },
      error: () => {
        // If error, fallback to openFood or default
        if (this.openFoodProduct?.image) {
          this.selectedSource = 'suggested';
        } else {
          this.selectedSource = null;
        }
        // Names fallback
        const openfoodName = this.openFoodProduct?.nombre?.trim();
        this.availableNames = openfoodName ? [{ label: 'Nombre producto OpenFoodFacts', value: openfoodName, source: 'openfoodfacts' }] : [];
        this.selectedNameSource = openfoodName ? 'openfoodfacts' : null;
        this.loading = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  getGapAnalysis(itemToGap: 'olimpica' | 'exito' | 'suggested') {
    let item: any, comparators: any[] = [], label = '', icon = '';
    if (itemToGap === 'olimpica' && this.olimpicaProduct?.product) {
      item = this.olimpicaProduct.product;
      label = 'Olimpica store';
      icon = 'assets/img/icons/stores/olimpica-store-icon.png';
      if (this.exitoProduct?.product) comparators.push({
        ...this.exitoProduct.product,
        label: 'Exito store',
        icon: 'assets/img/icons/stores/exito-store-icon.png'
      });
      comparators.push({
        price: Number(this.suggestedPrice),
        label: 'Precio sugerido vendedor',
        icon: 'assets/img/icons/stores/icon-vendor.png'
      });
    } else if (itemToGap === 'exito' && this.exitoProduct?.product) {
      item = this.exitoProduct.product;
      label = 'Exito store';
      icon = 'assets/img/icons/stores/exito-store-icon.png';
      if (this.olimpicaProduct?.product) comparators.push({
        ...this.olimpicaProduct.product,
        label: 'Olimpica store',
        icon: 'assets/img/icons/stores/olimpica-store-icon.png'
      });
      comparators.push({
        price: Number(this.suggestedPrice),
        label: 'Precio sugerido vendedor',
        icon: 'assets/img/icons/stores/icon-vendor.png'
      });
    } else if (itemToGap === 'suggested' && this.suggestedPrice) {
      item = { price: Number(this.suggestedPrice) };
      label = 'Precio sugerido vendedor';
      icon = 'assets/img/icons/stores/icon-vendor.png';
      if (this.olimpicaProduct?.product) comparators.push({
        ...this.olimpicaProduct.product,
        label: 'Olimpica store',
        icon: 'assets/img/icons/stores/olimpica-store-icon.png'
      });
      if (this.exitoProduct?.product) comparators.push({
        ...this.exitoProduct.product,
        label: 'Exito store',
        icon: 'assets/img/icons/stores/exito-store-icon.png'
      });
    }
    // Compute gap for each comparator
    const getPercentClass = (percent: number) => {
      if (percent >= 15) return 'bg-green-600';
      if (percent >= -5 && percent <= 5) return 'bg-yellow-400 text-gray-900';
      if (percent <= -15) return 'bg-orange-500';
      if (percent <= -30) return 'bg-red-700';
      return 'bg-gray-400';
    };
    const comparatorsResult = comparators.map(comp => {
      const amount = (item.price ?? 0) - (comp.price ?? 0);
      const percent = comp.price ? ((amount) / comp.price) * 100 : 0;
      return {
        label: comp.label,
        icon: comp.icon,
        amount,
        percent,
        percentClass: getPercentClass(percent)
      };
    });
    return {
      itemToGap: { label, icon },
      comparator1: comparatorsResult[0],
      comparator2: comparatorsResult[1]
    };
  }

  onCalculateGap(fromCase: string) {
    this.gapAnalysis = this.getGapAnalysis(fromCase as any);
    this.showGapTooltip = true;
  }

  selectName(source: string) {
    if (source === 'olimpica' || source === 'exito' || source === 'openfoodfacts') {
      this.selectedNameSource = source;
    }
  }

  onSelect(fromCase: string) {
    this.selectedSource = fromCase as any;
    let price: number | null = null;
    let image: string | null = null;
    let product: any = {};
    let nombre: string | null = null;
    // Get selected name value
    if (this.availableNames && this.selectedNameSource) {
      const found = this.availableNames.find(n => n.source === this.selectedNameSource);
      if (found) {
        nombre = found.value;
      }
    }
    if (fromCase === 'olimpica' && this.olimpicaProduct?.product) {
      price = this.olimpicaProduct.product.price ?? null;
      image = this.olimpicaProduct.product.image_url ?? null;
      product = { ...this.olimpicaProduct.product };
    } else if (fromCase === 'exito' && this.exitoProduct?.product) {
      price = this.exitoProduct.product.price ?? null;
      image = this.exitoProduct.product.image_url ?? null;
      product = { ...this.exitoProduct.product };
    } else if (fromCase === 'suggested' && this.suggestedPrice) {
      price = Number(this.suggestedPrice.replace(/[^0-9]/g, ''));
      image = this.openFoodProduct?.image ?? null;
      product = { ...this.openFoodProduct };
    }
    if (price !== null && !isNaN(price)) {
      this.dialogRef.close({ ...product, selectedSource: fromCase, price, image, nombre });
    }
  }

  openGapDialog(itemToGap: 'olimpica' | 'exito' | 'suggested') {
    this.gapAnalysis = this.getGapAnalysis(itemToGap);
    // Ensure correct data for 'suggested' case
    const vendedor = {
      price: Number(this.suggestedPrice),
      label: 'Vendedor',
      icon: 'assets/img/icons/stores/icon-vendor.png',
      image: this.openFoodProduct?.image || ''
    };
    const olimpica = this.olimpicaProduct?.product ? {
      ...this.olimpicaProduct.product,
      label: 'Olimpica',
      icon: 'assets/img/icons/stores/olimpica-store-icon.png',
      image: this.olimpicaProduct.product.image_url || ''
    } : null;
    const exito = this.exitoProduct?.product ? {
      ...this.exitoProduct.product,
      label: 'Exito',
      icon: 'assets/img/icons/stores/exito-store-icon.png',
      image: this.exitoProduct.product.image_url || ''
    } : null;
    const dialogRef = this.dialog.open(GapAnalysisDialogComponent, {
      data: {
        itemToGap: itemToGap === 'olimpica' ? olimpica : itemToGap === 'exito' ? exito : vendedor,
        vendedor,
        olimpica,
        exito,
        olimpicaProduct: this.olimpicaProduct,
        exitoProduct: this.exitoProduct
      },
      width: '560px',
      panelClass: 'gap-analysis-dialog'
    });
    dialogRef.afterClosed().subscribe((selected: any) => {
      if (selected) {
        // Pass result to parent (product-edit) via dialogRef.close
        this.dialogRef.close(selected);
      }
    });
  }
}
