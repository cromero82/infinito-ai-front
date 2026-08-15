# Foco POS en Tickets (`#productSearchInput`) — análisis y plan

**Fecha:** 2026-08-14  
**Alcance:** `TicketsComponent` / `DetalleTicketComponent` / modales de ventas  
**Contexto de negocio:** [PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md) (lectora de código de barras + tipeo por nombre)

---

## 1. Problema

El input `#productSearchInput` del panel principal de Tickets debe permanecer (o volver a estar) listo para:

1. **Lectora de código de barras** (entrada rápida + Enter).
2. **Búsqueda por nombre** cuando el producto no tiene código.

Hoy ese comportamiento **no es fiable al 100%**. Tras varias interacciones el foco se queda en tabs, botones, menús, o en el “vacío” del panel:

| Interacción | Comportamiento esperado | Estado típico hoy |
|-------------|-------------------------|-------------------|
| Cerrar `selector-productos` | Volver al buscador | A veces OK (emisión puntual) |
| Cerrar pago efectivo | Volver al buscador | A veces OK |
| Ticket rápido / editar tab | No robar foco al modal; al cerrar volver | Suppress + timeouts frágiles |
| Drag & drop de tabs | Volver al buscador | Suele fallar (nadie restaura) |
| Menú contextual “Más opciones” | Al cerrar, volver | Suele fallar |
| Clic en botón header / zona vacía | Volver al buscador | Suele fallar |
| Edición inline (producto / unitario / cantidad) | **Mantener** foco en el editor | OK si no hay restore agresivo |
| Modal abierto (`#pagaConInput`, `#searchInput` del selector) | **No** devolver foco al buscador | OK si hay suppress/hold |

El documento de producto ya deja claro: *otros inputs pueden tener el foco mientras operan; al terminar, el foco debe volver a `#productSearchInput`*.

---

## 2. Por qué falla el enfoque actual

Arquitectura actual (resumida):

- `DetalleTicketComponent` emite `focusSearchInputRequest`.
- `TicketsComponent.focusProductSearch()` hace `focus()` con **doble `requestAnimationFrame` + varios `setTimeout` (100 / 320 / +220 ms)**.
- Banderas locales: `suppressProductSearchFocusUntil`, `blockFocusRequest` en detalle.

Esto es **imperativo y reactivo por sitio**: cada flujo debe recordar llamar al restore. Material/CDK además **re-enfoca después** (tab links, overlays, botones), generando carreras que se “parchean” con más delays.

**Conclusión:** seguir solo añadiendo `setTimeout` por cada bug **aumenta deuda** y no garantiza cobertura (DnD, menú, clic genérico).

---

## 3. Opciones evaluadas

### A. Seguir iterando timeouts / llamadas puntuales
- Pros: cambios locales pequeños.
- Contras: no escala; frágil ante Material; cobertura incompleta.
- **Veredicto:** no como estrategia principal.

### B. Servicio central de foco POS + holds *(recomendada — eje)*
API conceptual:

- `hold(reason)` / `release(reason)` — stack o `Set` de motivos.
- `requestDefaultFocus({ select? })` — solo si `holds` vacío (salvo `force`).
- Un solo camino de restore (microtask / `afterNextRender` + 1–2 reintentos acotados), no cinco timers distintos por caller.

Cada flujo declara intención (“estoy en pago efectivo”) en lugar de pelear por el DOM.

### C. Observador global con exclusiones *(complemento necesario)*
En el host de Tickets (o el servicio):

- Escuchar `focusin` / `focusout` (fase capture) o `cdkMonitorFocus`.
- Si el foco sale del “área permitida” (buscador, editor inline activo, overlay MatDialog/MatMenu) **y** no hay hold → programar restore.
- Cubre “clic en cualquier lado”, DnD y menús sin listar cada botón.

### D. Contrato con overlays
- `dialogRef.afterClosed()` → siempre `release('dialog:…')` + restore.
- `menuClosed` → `release('menu:…')`.
- Al abrir: `hold('dialog:…')` / `hold('menu:…')`.

Estandariza lo que hoy a veces se hace a mano con suppress.

### E. Canal paralelo para la lectora *(muy recomendable en POS)*
Aunque el caret no esté en el input un instante:

- `keydown` a nivel documento **solo en la vista Tickets**, con exclusiones (edición, modal, otro `<input>`/`textarea`).
- Buffer de scan (timeout corto + Enter) → escribe en `productSearchCtrl` / dispara la misma búsqueda.

El foco visual sigue siendo UX; el scan es **resiliencia**. Práctica habitual en POS.

### F. Descartado como solución principal
- Autofocus HTML genérico.
- Más ráfagas de `setTimeout` por bug.
- Focus-lock global fuera de modales (Material ya atrapa foco **dentro** del dialog; el problema es **después** de cerrar).

---

## 4. Recomendación adoptada

| Pieza | Rol |
|-------|-----|
| **`TicketsPosFocusService`** | Holds + `requestDefaultFocus` + suppress unificado |
| **`focusin`/`focusout` (capture)** | Restore cuando el foco “se pierde” sin hold |
| **Contrato dialog/menu** | `hold` al abrir, `release` en `afterClosed` / `menuClosed` |
| **Barcode capture** | Buffer de teclado con exclusiones (lectora sin depender del caret) |
| **Edición inline / modales internos** | `hold('edit:…')` / `hold('dialog:…')` mientras operan |

`focusProductSearch()` del componente debe **delegar** en el servicio (misma API pública para el template y para `focusSearchInputRequest`), para no romper callers existentes de golpe.

---

## 5. Holds — catálogo inicial de `reason`

| Reason | Quién lo toma | Quién lo suelta |
|--------|---------------|-----------------|
| `dialog:selector-productos` | Detalle al abrir selector | `afterClosed` |
| `dialog:pago-efectivo` | Detalle al abrir pago | `afterClosed` |
| `dialog:ticket-rapido` | Tickets al abrir | `afterClosed` |
| `dialog:editar-tab` | Tickets al abrir | `afterClosed` |
| `menu:opciones-recibo` | Tickets al abrir menú | `menuClosed` |
| `edit:producto` / `edit:unitario` / `edit:cantidad` | Detalle al entrar en DC* | Al confirmar / blur / cancelar |
| `suppress:transient` | Doble clic tab u otras carreras cortas | Timeout o `release` explícito |

Regla: **mientras `holds.size > 0`, no restaurar** el buscador (salvo `force` en casos excepcionales documentados).

---

## 6. Exclusiones del restore / barcode

No restaurar ni capturar barcode si el `activeElement` (o el target del keydown) está en:

- El propio `#productSearchInput` (ya tiene el foco / ya recibe teclas).
- Cualquier `.cdk-overlay-container` (dialogs, menus, selects).
- Inputs de edición inline del detalle (`.editing-*` / controles `editing*Ctrl` activos).
- Otros `input`, `textarea`, `[contenteditable]` legítimos dentro de un hold.

---

## 7. Plan de implementación (fases)

### Fase 1 — Base (esta iteración) ✅
1. Crear `TicketsPosFocusService` (provided en `TicketsComponent`).
2. Documentar este análisis (este archivo).
3. `TicketsComponent.focusProductSearch` → delega en el servicio.
4. Registrar input; `focusout` capture → `requestDefaultFocus` si no hay holds.
5. Holds en: menú opciones, ticket rápido, editar tab; restore tras DnD de tabs.
6. Holds en detalle: selector productos, pago efectivo; holds de edición inline.
7. Listener barcode (buffer básico) con exclusiones.

### Fase 2 — Endurecer
- Revisar todos los `focusSearchInputRequest.emit()` y alinearlos a `release` + `requestDefaultFocus` (evitar doble restore).
- Unificar/retirar `blockFocusRequest` y `suppressProductSearchFocusUntil` a favor del servicio.
- Tests de integración ligeros (abrir/cerrar dialog → foco en buscador; hold edición → no restore).

### Fase 3 — Pulido UX
- Ajuste fino de reintentos únicos post-Material (un solo schedule, no N callers).
- Telemetría opcional (`actividadUi`) cuando el restore se omite por hold o se fuerza.

---

## 8. Archivos clave

| Tema | Ubicación |
|------|-----------|
| Requisito de negocio | `PROJECT_CONTEXT.md` |
| Este análisis / plan | `.cursor/rules/tickets-pos-focus-coordinator.md` |
| Servicio | `src/app/pages/apps/ventas/tickets/tickets-pos-focus.service.ts` |
| Host / input / menú / DnD | `tickets.component.ts` / `.html` |
| Emisiones, edición, dialogs de venta | `detalle-ticket.component.ts` |
| Notas previas de foco / Enter / debounce | Sección “Comportamiento implementado” en `PROJECT_CONTEXT.md` |

---

## 9. Criterios de aceptación

1. Tras cerrar selector de productos o pago efectivo, el caret vuelve a `#productSearchInput` de forma consistente.
2. Tras menú contextual, ticket rápido (cerrado), DnD de tabs o clic en zonas no editables del panel, el foco vuelve al buscador.
3. Durante edición inline o modal abierto, el buscador **no** roba el foco.
4. Con foco en un botón del header, un escaneo (ráfaga de teclas + Enter) sigue alimentando la búsqueda (canal barcode).
5. No reintroducir doble apertura del selector por `keyup` residual (seguir usando `keydown.enter` en el buscador).

---

## 10. Nota para IAs / mantenimiento

Si el síntoma es “el foco no vuelve al buscador” o “la lectora no escribe”:

1. Revisar **holds activos** en `TicketsPosFocusService` (¿alguien olvidó `release`?).
2. No añadir un nuevo `setTimeout` suelto en el caller: usar `hold` / `release` / `requestDefaultFocus`.
3. No enfocar el buscador desde un dialog abierto sin `force` documentado.
