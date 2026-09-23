import { Injectable } from '@angular/core';

/**
 * Resultado del cálculo de viewport para tablas con scroll e infinite scroll.
 * @see TableViewportService
 */
export interface TableViewportResult {
  /** Número de registros a solicitar por página (page size) */
  pageSize: number;
  /** Altura máxima en px para el contenedor con scroll */
  maxHeight: number;
  /** Filas visibles calculadas (sin scroll) */
  visibleRows: number;
}

/**
 * Servicio reutilizable para calcular el viewport de tablas de datos según la resolución de pantalla.
 *
 * **Escenario:** Listas/tablas con paginación donde el número de registros visibles debe ajustarse
 * dinámicamente según la altura del viewport (navbar, header, tabs, filtros, etc.).
 *
 * **Solución:** Calcular `pageSize` y `maxHeight` del contenedor en función de `window.innerHeight`,
 * restando el espacio reservado para elementos fijos. Incluye infinite scroll: al hacer scroll vertical
 * cerca del final, cargar la siguiente página.
 *
 * **Uso en componente:**
 * 1. Inyectar TableViewportService
 * 2. Llamar calculate() en ngOnInit y @HostListener('window:resize')
 * 3. Aplicar result.maxHeight al contenedor con overflow-y: auto
 * 4. Usar result.pageSize en las peticiones paginadas al API
 * 5. Implementar scroll listener para loadMore cuando scrollTop + clientHeight >= scrollHeight - threshold
 *
 * @example
 * ```ts
 * this.viewport = this.tableViewportService.calculate({ reservedHeight: 388 });
 * this.pageSize = this.viewport.pageSize;
 * this.tableScrollMaxHeight = this.viewport.maxHeight;
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TableViewportService {

  /** Altura por defecto de cada fila en px (Material table compacta) */
  static readonly DEFAULT_ROW_HEIGHT = 28;

  /** Altura mínima por defecto para evitar colapso (≈4 filas + header) */
  static readonly DEFAULT_MIN_HEIGHT = 140;

  /** Page size mínimo por defecto */
  static readonly DEFAULT_MIN_PAGE_SIZE = 5;

  /**
   * Calcula el viewport de la tabla según la resolución actual.
   *
   * @param options Configuración opcional
   * @param options.reservedHeight Espacio reservado en px (navbar, header, tabs, filtros, FAB). Por defecto 388 (≈10 filas en 1080p@125%)
   * @param options.rowHeight Altura por fila en px. Por defecto 28
   * @param options.minHeight Altura mínima del contenedor. Por defecto 140
   * @param options.minPageSize Mínimo de registros por página. Por defecto 5
   */
  calculate(options?: {
    reservedHeight?: number;
    rowHeight?: number;
    minHeight?: number;
    minPageSize?: number;
  }): TableViewportResult {
    const reservedHeight = options?.reservedHeight ?? 388;
    const rowHeight = options?.rowHeight ?? TableViewportService.DEFAULT_ROW_HEIGHT;
    const minHeight = options?.minHeight ?? TableViewportService.DEFAULT_MIN_HEIGHT;
    const minPageSize = options?.minPageSize ?? TableViewportService.DEFAULT_MIN_PAGE_SIZE;

    const available = Math.max(minHeight, window.innerHeight - reservedHeight);
    const visibleRows = Math.floor(available / rowHeight);
    const pageSize = Math.max(minPageSize, visibleRows);

    return {
      pageSize,
      maxHeight: available,
      visibleRows
    };
  }
}
