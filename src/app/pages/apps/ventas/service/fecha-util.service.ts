import { Injectable } from '@angular/core';

/**
 * Servicio de utilería para formateo de fechas.
 * Reutilizable en cualquier componente del módulo de ventas.
 *
 * Formatos retornados (siempre incluye hora):
 *  - "Hoy, 3:17 p.m."
 *  - "Ayer, 3:17 p.m."
 *  - "Lunes, 3:17 p.m."       (dentro de los últimos 7 días)
 *  - "14-Feb, 3:17 p.m."      (más de 7 días)
 */
@Injectable({
  providedIn: 'root'
})
export class FechaUtilService {

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
