# Página "Cotiza INFINITO!!" — Cotización para invitados (móvil)

> Onboarding de diseño para retomar/mantener la funcionalidad de cotización con
> sesión de invitado, optimizada para celulares. Pensado para dar contexto suficiente
> a cualquier IA o desarrollador que entre en frío.

---

## 1. Qué es y para qué sirve

App/página **móvil** dentro del mismo proyecto Angular (no es un proyecto aparte),
pensada para que **clientes del establecimiento** consulten productos y armen una
**cotización** (no es una venta/checkout, solo estimar precios y cantidades).

Flujo del cliente:
1. Abre el enlace (en su celular).
2. Entra automáticamente como **INVITADO** (sin credenciales).
3. **Escanea un código de barras** (cámara) o busca por código/nombre.
4. Ve el producto con su **precio** y un botón **"Agregar"** inmediatamente visible.
5. Ajusta cantidades con un stepper `– n +`.
6. Revisa el total en la **barra inferior del carrito** y el panel deslizable.
7. **"Fin cotización"** cierra la sesión de invitado y reinicia para el siguiente cliente.

No aparece en los tabs del POS de escritorio (Tickets, Productos, Historial, Financiero).

---

## 2. Ruta y por qué es "standalone"

URL: **`/apps/personas/micotizacion`**

Registrada en `src/app/app.routes.ts` **ANTES** de la ruta raíz `''` que usa
`LayoutComponent`. Esto es intencional: el matcher de Angular evalúa en orden, así
que esta ruta se resuelve como **componente standalone a pantalla completa**, SIN el
layout de escritorio de Vex (sidebar, toolbar, tabs). Por eso tiene su propio header
con marca + chip INVITADO + "Fin cotización".

```ts
// app.routes.ts (fragmento, va antes del path: '' con LayoutComponent)
{
  path: 'apps/personas/micotizacion',
  loadComponent: () =>
    import('./pages/apps/personas/micotizacion/micotizacion.component')
      .then((m) => m.MiCotizacionComponent)
}
```

Si en el futuro se mueve dentro del `LayoutComponent`, heredaría el chrome de escritorio
(NO deseado). Mantenerla como ruta hermana de nivel superior.

---

## 3. Archivos involucrados

| Archivo | Rol |
|---|---|
| `src/app/pages/apps/personas/micotizacion/micotizacion.component.ts` | Lógica: sesión invitado, escáner, búsqueda con debounce, carrito en memoria |
| `src/app/pages/apps/personas/micotizacion/micotizacion.component.html` | UI móvil: header, escáner, búsqueda, tarjetas de producto, barra y panel de carrito |
| `src/app/pages/apps/personas/micotizacion/micotizacion.component.scss` | Estilos mobile-first (usa variables `--vex-*` con fallbacks) |
| `src/app/auth/service/auth.service.ts` | `loginGuest()` y `cerrarSesionServidor()` (ver §4) |
| `src/app/pages/apps/productos/service/products-service.ts` | `obtenerProductos()` (búsqueda por código/nombre) |
| `src/app/pages/apps/productos/barcode-scanner-dialog/barcode-scanner-dialog.component.ts` | **Reutilizado** tal cual para escanear (no se duplicó) |

---

## 4. Seguridad / sesión de invitado

Endpoints del servidor de seguridad (MS auth, ver §despliegue para el host):

- `POST /auth/login-guest` → devuelve un **JWT genérico** (rol `invitado`). Sin credenciales.
- `POST /auth/logout` → invalida la sesión.
- (`/auth/validate`, `/auth/claims` existen pero no se usan en esta página.)

En `AuthService`:
- `loginGuest()`: hace `POST /auth/login-guest` (responseType text), guarda el token con
  la misma mecánica que un login normal (`handleAuthResponse` → `localStorage['user-token']`),
  y **fuerza** `localStorage['user-nombre'] = 'INVITADO'`.
- `cerrarSesionServidor()`: `POST /auth/logout`; no rompe la cadena si el server falla.

**Interceptor** (`src/app/core/interceptors/auth.interceptor.ts`): no requirió cambios.
`/auth/login-guest` ya queda excluido del header `Authorization` porque su URL **contiene**
`/auth/login` (regla `excludedRoutes` con `url.includes(...)`). `/auth/logout` SÍ envía el
Bearer (correcto). El token se reutiliza bajo la clave estándar `user-token`, así que el
interceptor lo adjunta automáticamente a `/products`.

> Nota de seguridad: la barrera real es el backend. El rol `invitado` DEBE estar
> restringido a **solo lectura** de productos en el MS de seguridad (que no pueda
> crear/editar/borrar). El proxy (ver doc de despliegue) es defensa en profundidad.

---

## 5. Componente — decisiones clave

- **Carrito 100% en cliente** (`Map<string, ItemCotizacion>` con clave = `barcode`).
  Es una cotización, no una venta: no se persiste ni se envía al backend. `incrementar`,
  `decrementar` (elimina al llegar a 0), `quitarDelCarrito`, `vaciarCarrito`, getters
  `items`, `totalItems`, `totalCotizacion`.
- **Búsqueda con debounce (350 ms)** sobre `searchCtrl.valueChanges`; mínimo 2 caracteres
  (`MIN_SEARCH_LENGTH`). Llama `ProductsService.obtenerProductos(query, 0, 20)`.
- **Escáner reutilizado**: `abrirEscaner()` abre `BarcodeScannerDialogComponent`
  (html5-qrcode); al cerrar con un código, hace `searchCtrl.setValue(codigo)` y eso dispara
  la búsqueda. **No** agrega al carrito automáticamente (el usuario decide con "Agregar").
- **Sesión al iniciar**: `ngOnInit` llama `iniciarSesionInvitado()` (loginGuest). Muestra
  estado "Conectando…", y si falla, ícono `wifi_off` + "No se pudo conectar al servidor" +
  botón **Reintentar**.
- **Fin cotización**: `cerrarSesionServidor()` → `authService.logout()` → limpia carrito y
  estado → vuelve a `iniciarSesionInvitado()` (kiosco listo para el siguiente cliente).
- **ChangeDetectionStrategy.OnPush** + `markForCheck()` tras mutaciones (carrito en memoria).
- **Moneda**: formato Colombia con `currency:'COP':'symbol-narrow':'1.0-0'` (muestra `$` sin decimales).

---

## 6. UI / estilo (mobile-first)

- Header con **degradado del color de marca** (`--vex-color-primary-600/500`), logo en
  contenedor blanco redondeado, título "Cotiza INFINITO!!", **chip INVITADO** translúcido,
  y botón "Fin cotización" integrado.
- Botón de **escaneo** grande y prominente (primario), campo de búsqueda con `mat-form-field`.
- **Tarjetas de producto**: foto (o placeholder `inventory_2`), nombre, código, precio
  destacado; botón "Agregar" o stepper si ya está en carrito.
- **Barra inferior fija** del carrito (badge con nº de ítems + total) y **panel tipo
  bottom-sheet** con líneas, subtotales, quitar, total y "Vaciar".
- Usa unidades `100dvh`, `env(safe-area-inset-*)`, y un `@media (max-width: 360px)` para
  pantallas muy estrechas. Variables `--vex-*` con *fallbacks* por si se renderiza fuera del
  layout (esta ruta no carga el tema vía LayoutComponent, pero los estilos globales de Vex
  en `styles.scss` sí cargan a nivel app).

### Íconos
Se usan del namespace `mat:` (resuelto por `IconsService` desde
`@material-design-icons/svg/two-tone`). Íconos usados: `account_circle`, `logout`,
`qr_code_scanner`, `search`, `close`, `inventory_2`, `photo_camera`, `add`, `remove`,
`add_shopping_cart`, `shopping_cart`, `delete`, `wifi_off`. Si agregas íconos, confirma que
el `.svg` exista en `node_modules/@material-design-icons/svg/two-tone/`.

---

## 7. Dependencias de datos / puntos a vigilar en mantenimiento

- **Precios**: `producto.precio` (modelo `Producto` en
  `src/app/pages/apps/productos/model/producto.ts`). Si se quisiera precio por unidad
  (`precioUnidad`) habría que decidir cuál mostrar (hoy se usa `precio`).
- **Foto**: `producto.foto` es un string (URL). Si el backend la sirve como ruta relativa a
  `:8088`, al exponer por proxy/túnel habría que enrutar también ese path (ver doc despliegue:
  el `Caddyfile` ya incluye `/api/images/*`). Si no hay foto, se muestra placeholder.
- **Cámara requiere HTTPS**: `getUserMedia` solo funciona en *contexto seguro* (`https` o
  `localhost`). Sobre `http://<ip>` la cámara queda bloqueada por el navegador. Por eso el
  despliegue para celulares usa HTTPS (Cloudflare Tunnel). La búsqueda por texto funciona igual.

---

## 8. Cómo probar rápido

- Escritorio (gestor): `http://localhost:4200/apps/personas/micotizacion`.
- Celular por internet (HTTPS, con cámara): ver
  `.cursor/despliegue-cotizacion-invitado-lan-cloudflare.md` (host dinámico + Caddy + cloudflared).

---

## 9. Reglas relacionadas

- `.cursor/rules/pos-app-boundaries.mdc` — límites de qué es POS real vs herencia Vex.
- `.cursor/rules/pos-app-map.mdc` — mapa de dominios/rutas/estilos.
- `.cursor/despliegue-cotizacion-invitado-lan-cloudflare.md` — historia de hosts y despliegue.
