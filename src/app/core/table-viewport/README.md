# Table Viewport - Ajuste de pantalla a tabla de datos

Servicio y estilos reutilizables para tablas/listas que deben mostrar un número de registros visible según la resolución de pantalla, con infinite scroll.

## Uso

### 1. Inyectar el servicio

```ts
constructor(private tableViewportService: TableViewportService) {}
```

### 2. Calcular y aplicar en init y resize

```ts
private applyViewport() {
  const v = this.tableViewportService.calculate({ reservedHeight: 388 });
  this.pageSize = v.pageSize;
  this.tableScrollMaxHeight = v.maxHeight;
}

ngOnInit() {
  this.applyViewport();
  // ...
}

@HostListener('window:resize')
onWindowResize() {
  this.applyViewport();
}
```

### 3. Template

```html
<div #tableScroll class="table-scroll-container" *ngIf="!loading"
     [style.max-height.px]="tableScrollMaxHeight">
  <table mat-table [dataSource]="dataSource">...</table>
</div>
```

### 4. Estilos

Incluir `table-viewport.scss` en el componente o definir localmente:

```scss
.table-scroll-container {
  overflow-y: auto;
  overflow-x: auto;
}
```

### 5. Infinite scroll

- Escuchar `scroll` en el contenedor
- Cuando `scrollTop + clientHeight >= scrollHeight - 100`, llamar API con `page + 1`
- Añadir `page.content` al dataSource existente

## Opciones de `calculate()`

| Opción | Default | Descripción |
|-------|---------|-------------|
| reservedHeight | 388 | px reservados (navbar, header, tabs, filtros) |
| rowHeight | 28 | px por fila |
| minHeight | 140 | altura mínima del contenedor |
| minPageSize | 5 | mínimo de registros por página |

## Referencia

Implementación completa: `src/app/pages/apps/gastos/egresos/egreso-list/`
