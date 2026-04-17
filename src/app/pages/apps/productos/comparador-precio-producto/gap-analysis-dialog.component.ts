import {
  Component,
  Inject,
  OnInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { NgClass, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'gap-analysis-dialog',
  imports: [
    NgClass,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    FormsModule
  ],
  providers: [DecimalPipe],
  templateUrl: './gap-analysis-dialog.component.html',
  styleUrls: ['./gap-analysis-dialog.component.scss']
})
export class GapAnalysisDialogComponent implements OnInit {
  selectedItemToGap: any;
  comparator1: any = null;
  comparator2: any = null;
  vendedorInputValue: string = '';

  @ViewChild('vendedorInput') vendedorInputRef!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<GapAnalysisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    // Set initial selected itemToGap
    if (this.data.itemToGap && typeof this.data.itemToGap.price === 'number') {
      this.selectedItemToGap = this.data.itemToGap;
    } else {
      const candidates = [
        this.data.vendedor,
        this.data.olimpica,
        this.data.exito
      ].filter((item) => item && typeof item.price === 'number');
      this.selectedItemToGap = candidates.length ? candidates[0] : null;
    }
    if (this.selectedItemToGap?.label === 'Vendedor') {
      this.vendedorInputValue =
        this.selectedItemToGap.price != null
          ? String(this.selectedItemToGap.price)
          : '';
    }
    this.calculateComparators();
  }

  close() {
    this.dialogRef.close();
  }

  changeItemToGap(label: string) {
    const candidates = [
      this.data.vendedor,
      this.data.olimpica,
      this.data.exito
    ].filter(Boolean);
    const found = candidates.find((item) => item.label === label);
    if (found) {
      this.selectedItemToGap = found;
      if (found.label === 'Vendedor') {
        this.vendedorInputValue =
          found.price != null ? String(found.price) : '';
        setTimeout(() => {
          if (this.vendedorInputRef) {
            this.vendedorInputRef.nativeElement.focus();
            this.vendedorInputRef.nativeElement.select();
          }
        }, 0);
      }
      this.calculateComparators();
    }
  }

  calculateComparators() {
    // Get all items except the selected one
    const items = [
      this.data.vendedor,
      this.data.olimpica,
      this.data.exito
    ].filter((item) => item && item !== this.selectedItemToGap);
    // Calculate gap for each comparator
    const getPercentClass = (percent: number) => {
      if (percent >= 15) return 'bg-green-600';
      if (percent >= -5 && percent <= 5) return 'bg-yellow-400 text-gray-900';
      if (percent <= -15) return 'bg-orange-500';
      if (percent <= -30) return 'bg-red-700';
      return 'bg-gray-400';
    };
    if (items.length > 0) {
      const comp1 = items[0];
      const amount1 = (this.selectedItemToGap.price ?? 0) - (comp1.price ?? 0);
      const percent1 = comp1.price ? (amount1 / comp1.price) * 100 : 0;
      this.comparator1 = {
        label: comp1.label,
        icon: comp1.icon,
        amount: amount1,
        percent: percent1,
        percentClass: getPercentClass(percent1),
        price: comp1.price // <-- add price property
      };
    } else {
      this.comparator1 = null;
    }
    if (items.length > 1) {
      const comp2 = items[1];
      const amount2 = (this.selectedItemToGap.price ?? 0) - (comp2.price ?? 0);
      const percent2 = comp2.price ? (amount2 / comp2.price) * 100 : 0;
      this.comparator2 = {
        label: comp2.label,
        icon: comp2.icon,
        amount: amount2,
        percent: percent2,
        percentClass: getPercentClass(percent2),
        price: comp2.price // <-- add price property
      };
    } else {
      this.comparator2 = null;
    }
  }

  onVendedorInputChange() {
    if (this.selectedItemToGap?.label === 'Vendedor') {
      const value = Number(this.vendedorInputValue.replace(/[^0-9]/g, ''));
      this.selectedItemToGap.price = value;
      this.calculateComparators();
    }
  }

  changeVendedorPrice(delta: number) {
    if (this.selectedItemToGap?.label === 'Vendedor') {
      let value = Number(this.vendedorInputValue.replace(/[^0-9]/g, '')) || 0;
      value += delta;
      if (value < 0) value = 0;
      this.vendedorInputValue = String(value);
      this.selectedItemToGap.price = value;
      this.calculateComparators();
    }
  }

  selectCurrentOption() {
    // Return selected price, name, image, and label to product-edit modal
    const result = {
      price: this.selectedItemToGap?.price,
      nombre: this.selectedItemToGap?.nombre || this.selectedItemToGap?.label,
      image: this.selectedItemToGap?.image,
      label: this.selectedItemToGap?.label
    };
    this.dialogRef.close(result);
  }
}
