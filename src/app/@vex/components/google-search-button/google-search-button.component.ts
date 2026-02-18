import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export type GoogleSearchType = 'name' | 'barcode';

@Component({
  selector: 'vex-google-search-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './google-search-button.component.html',
  styleUrls: ['./google-search-button.component.scss']
})
export class GoogleSearchButtonComponent {
  @Input() searchType: GoogleSearchType = 'name';
  @Input() productName: string = '';
  @Input() barcode: string = '';
  @Input() disabled: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'small';
  @Input() color: 'primary' | 'accent' | 'warn' = 'accent';
  @Input() showIcon: boolean = true;
  @Input() customTooltip?: string;

  @Output() searchClicked = new EventEmitter<{ type: GoogleSearchType; query: string }>();

  constructor(private snackBar: MatSnackBar) {}

  get tooltipText(): string {
    if (this.customTooltip) {
      return this.customTooltip;
    }
    
    if (this.searchType === 'barcode') {
      return 'Buscar código de barras en Google';
    } else {
      return 'Buscar nombre del producto en Google';
    }
  }

  get buttonIcon(): string {
    if (this.searchType === 'barcode') {
      return 'mat:qr_code';
    } else {
      return 'mat:search';
    }
  }

  get hasValidData(): boolean {
    if (this.searchType === 'barcode') {
      return !!(this.barcode && this.barcode.trim().length > 0);
    } else {
      return !!(this.productName && this.productName.trim().length > 0);
    }
  }

  onSearchClick(): void {
    if (this.disabled || !this.hasValidData) {
      return;
    }

    let query = '';
    let validationError = '';

    if (this.searchType === 'barcode') {
      const barcodeLimpio = this.barcode.trim();
      query = `${barcodeLimpio} PRECIO medellin`;
      
      // Validar que sea un código de barras válido (solo números, típicamente 8, 12 o 13 dígitos)
      const esCodigoValido = /^\d{8,13}$/.test(barcodeLimpio);
      
      if (!esCodigoValido) {
        validationError = 'El código de barras no tiene un formato válido';
      }
    } else {
      // Para nombre, extraer solo el nombre si viene con formato "NOMBRE; Precio: $XXX"
      let nombreLimpio = this.productName;
      if (nombreLimpio.includes(';')) {
        nombreLimpio = nombreLimpio.split(';')[0].trim();
      }
      
      query = `${nombreLimpio} PRECIO medellin`;
      
      if (!nombreLimpio || nombreLimpio.trim().length === 0) {
        validationError = 'No hay nombre de producto para buscar';
      }
    }

    if (validationError) {
      this.snackBar.open(validationError, 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'right',
        panelClass: this.searchType === 'barcode' ? ['error-snackbar'] : undefined
      });
      return;
    }

    // Emitir evento para que el componente padre maneje la búsqueda
    this.searchClicked.emit({ type: this.searchType, query });

    // Abrir Google con la búsqueda
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  }
}
