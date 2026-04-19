import { Provider } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  NativeDateAdapter
} from '@angular/material/core';

/**
 * Formato de fecha para todos los MatDatepicker de la app: dd/MM/yyyy (locale es-CO).
 * Se registra en `app.config.ts` con `provideMaterialDateDDMMYYYY()`.
 */
export class DateAdapterDDMMYYYY extends NativeDateAdapter {
  override format(date: Date, displayFormat: object): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.includes('/')) {
      const [d, m, y] = value.split('/').map(Number);
      if (d && m && y) {
        return new Date(y, m - 1, d);
      }
    }
    return super.parse(value as string);
  }
}

export const MATERIAL_DDMMYYYY_DATE_FORMATS = {
  parse: { dateInput: 'dd/MM/yyyy' },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  }
};

export function provideMaterialDateDDMMYYYY(): Provider[] {
  return [
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: DateAdapter, useClass: DateAdapterDDMMYYYY },
    { provide: MAT_DATE_FORMATS, useValue: MATERIAL_DDMMYYYY_DATE_FORMATS }
  ];
}
