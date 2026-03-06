import { Injectable } from '@angular/core';

/**
 * Resultado para formateo de fecha relativa en tablas.
 * - hasTwoLines: true → mostrar fecha arriba y descripción abajo (centrado)
 * - hasTwoLines: false → mostrar solo line1 (ej. "Hoy", "Ayer", "Martes")
 */
export interface FechaRelativaTableResult {
  line1: string;
  line2?: string;
  hasTwoLines: boolean;
}

/**
 * Servicio de utilería para formateo de fechas.
 * Reutilizable en cualquier componente del módulo de ventas.
 *
 * formatDate (con hora):
 *  - "Hoy, 3:17 p.m."
 *  - "Ayer, 3:17 p.m."
 *  - "Lunes, 3:17 p.m."       (dentro de los últimos 7 días)
 *  - "14-Feb, 3:17 p.m."      (más de 7 días)
 *
 * formatDateRelativeTable (solo fecha, para tablas):
 *  - Hoy / Ayer / Día semana (< 7 días)
 *  - Fecha + "Más de X" (>= 7 días)
 */
@Injectable({
  providedIn: 'root'
})
export class FechaUtilService {

  private readonly daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  /**
   * Formatea una fecha respecto a hoy para mostrar en tablas.
   * - Hoy → "Hoy"
   * - Ayer → "Ayer"
   * - 3-6 días → día de semana (ej. "Martes")
   * - >= 7 días → { fecha dd/MM/yyyy arriba, descripción "Más de X" abajo }
   *
   * @param dateValue Fecha (Date, string ISO, o null/undefined)
   * @returns FechaRelativaTableResult o null si la fecha es inválida
   */
  formatDateRelativeTable(dateValue: Date | string | null | undefined): FechaRelativaTableResult | null {
    if (dateValue == null) return null;
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffMs = today.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Fecha futura: mostrar solo fecha formateada (dd/MM/yyyy)
    if (diffDays < 0) {
      const dateStr = this.formatDateDDMMYYYY(date);
      return { line1: dateStr, hasTwoLines: false };
    }

    if (diffDays === 0) {
      return { line1: 'Hoy', hasTwoLines: false };
    }
    if (diffDays === 1) {
      return { line1: 'Ayer', hasTwoLines: false };
    }
    if (diffDays >= 2 && diffDays < 7) {
      const dayName = this.daysOfWeek[date.getDay()];
      return { line1: dayName, hasTwoLines: false };
    }

    // >= 7 días: fecha formateada (dd/MM/yyyy) + descripción relativa
    const dateStr = this.formatDateDDMMYYYY(date);
    const label = this.getRelativeLabel(diffDays);
    return { line1: dateStr, line2: label, hasTwoLines: true };
  }

  private formatDateDDMMYYYY(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private getRelativeLabel(daysDiff: number): string {
    if (daysDiff <= 15) return 'Más de 7 días';
    if (daysDiff <= 30) return 'Más de 15 días';
    if (daysDiff <= 60) return 'Más de un mes';
    if (daysDiff <= 90) return 'Más de dos meses';
    if (daysDiff <= 180) return 'Más de 3 meses';
    if (daysDiff <= 270) return 'Más de 6 meses';
    if (daysDiff <= 364) return 'Más de 9 meses';
    if (daysDiff <= 729) return 'Más de 1 año';
    if (daysDiff <= 1095) return 'Más de 2 años';
    return 'Más de 3 años';
  }

  /**
   * Formatea una fecha ISO a un texto amigable con hora.
   * @param dateString Fecha en formato ISO (ej. "2026-02-15T13:11:24")
   * @returns Texto formateado ("Hoy, 3:17 p.m.", "Ayer, 3:17 p.m.", etc.)
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();

    if (dateOnly.getTime() === today.getTime()) {
      return `Hoy, ${timeStr}`;
    }

    if (dateOnly.getTime() === yesterday.getTime()) {
      return `Ayer, ${timeStr}`;
    }

    const daysDiff = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7 && daysDiff > 0) {
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysOfWeek[date.getDay()];
      return `${dayName}, ${timeStr}`;
    }

    const day = date.getDate();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = months[date.getMonth()];
    return `${day}-${monthName}, ${timeStr}`;
  }
}
