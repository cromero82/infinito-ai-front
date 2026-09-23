# GoogleSearchButton Component

Un componente reutilizable de Angular para buscar en Google por nombre de producto o código de barras.

## Características

- **Búsqueda por nombre**: Busca el nombre del producto en Google con "PRECIO medellin" incluido
- **Búsqueda por código de barras**: Valida y busca códigos de barras en Google
- **Validación automática**: Verifica que los datos sean válidos antes de buscar
- **Diseño flexible**: Soporta diferentes tamaños y colores
- **Eventos personalizables**: Emite eventos cuando se realiza una búsqueda
- **Tooltips integrados**: Muestra tooltips descriptivos automáticamente

## Uso Básico

```html
<!-- Búsqueda por nombre de producto -->
<vex-google-search-button
  searchType="name"
  [productName]="product.name"
  (searchClicked)="onSearch($event)">
</vex-google-search-button>

<!-- Búsqueda por código de barras -->
<vex-google-search-button
  searchType="barcode"
  [barcode]="product.barcode"
  (searchClicked)="onSearch($event)">
</vex-google-search-button>
```

## Inputs

| Propiedad | Tipo | Valor por defecto | Descripción |
|-----------|------|------------------|-------------|
| `searchType` | `'name' \| 'barcode'` | `'name'` | Tipo de búsqueda a realizar |
| `productName` | `string` | `''` | Nombre del producto para buscar (requerido si `searchType='name'`) |
| `barcode` | `string` | `''` | Código de barras para buscar (requerido si `searchType='barcode'`) |
| `disabled` | `boolean` | `false` | Deshabilita el botón |
| `size` | `'small' \| 'medium' \| 'large'` | `'small'` | Tamaño del botón |
| `color` | `'primary' \| 'accent' \| 'warn'` | `'accent'` | Color del botón |
| `showIcon` | `boolean` | `true` | Muestra u oculta el icono |
| `customTooltip` | `string` | `undefined` | Tooltip personalizado (sobrescribe el automático) |

## Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `searchClicked` | `{ type: 'name' \| 'barcode'; query: string }` | Se emite cuando se realiza una búsqueda |

## Comportamiento

### Búsqueda por Nombre
- Extrae automáticamente el nombre si viene en formato "NOMBRE; Precio: $XXX"
- Agrega automáticamente "PRECIO medellin" a la búsqueda
- Valida que el nombre no esté vacío

### Búsqueda por Código de Barras
- Valida que el código contenga solo números y tenga entre 8-13 dígitos
- Muestra mensajes de error específicos para códigos inválidos
- Busca directamente el código de barras en Google

## Ejemplos Avanzados

```html
<!-- Botón grande con texto personalizado -->
<vex-google-search-button
  searchType="name"
  [productName]="product.name"
  size="large"
  color="primary"
  customTooltip="Buscar este producto en Google">
</vex-google-search-button>

<!-- Botón deshabilitado condicionalmente -->
<vex-google-search-button
  searchType="barcode"
  [barcode]="product.barcode"
  [disabled]="!product.barcode || loading">
</vex-google-search-button>

<!-- Manejo del evento de búsqueda -->
<vex-google-search-button
  searchType="name"
  [productName]="product.name"
  (searchClicked)="handleGoogleSearch($event)">
</vex-google-search-button>
```

```typescript
handleGoogleSearch(event: { type: 'name' | 'barcode'; query: string }) {
  console.log(`Búsqueda realizada: ${event.type} - ${event.query}`);
  // Aquí puedes agregar tracking, analytics, etc.
}
```

## Estilos

El componente incluye estilos CSS para:
- Iconos superpuestos para búsqueda de código de barras
- Diferentes tamaños de botón
- Efectos hover
- Compatibilidad con clases existentes (`.buscar-button`, `.buscar-barcode-button`, `.buscar-nombre-button`)

## Dependencias

- Angular Material (Button, Icon, Tooltip)
- MatSnackBar (para mensajes de error)
- RxJS (para manejo de eventos)

## Importación

```typescript
import { GoogleSearchButtonComponent } from '@vex/components/google-search-button';

// En un componente standalone:
@Component({
  standalone: true,
  imports: [GoogleSearchButtonComponent],
  // ...
})
```
