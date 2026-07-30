# POS Infinito — Plan maestro (sesión planeación 2026)

**Última actualización:** 2026-06-06  
**Estado:** **APROBADO por el usuario** — listo para implementación por fases.  
**Alcance:** Persona natural **NO responsable de IVA** · POS local · trazabilidad / «DIAN Ready mínimo» **sin** facturación electrónica.

> **Punto de entrada para cualquier IA:** leer **este archivo primero**, luego los hijos según la tarea (§2). No implementar SQL ni código sin indicar la **fase/sprint** en curso.

> **Handoff financiero actualizado (2026-07-18):**
> [`ONBOARDING-FINANZAS-ORIGENES-CIERRES.md`](./ONBOARDING-FINANZAS-ORIGENES-CIERRES.md).
> Para Egresos, Orígenes, ledger o Cierre, leer ese documento antes que los planes históricos.

---

## 1. Repositorios y puertos

| Repo | Rol | Puerto / BD | Onboarding adicional |
|------|-----|-------------|----------------------|
| **`pos-relational-data-service`** | Lógica de tienda: ventas, inventario, finanzas, cortes, bitácora | `:8088` · BD `controlneg_rmx_db` schema `public` | `pos-relational-data-service/src/main/resources/doc/contextos/AI-ONBOARDING-basic.md` |
| **`infinito-ai-front`** | Angular 17 — UI POS | `:4200` (dev) | Reglas en `.cursor/rules/movimientos-almacen/` |
| **`infinito-security`** | Usuarios, roles JWT, schema `security` | MS auth (misma BD, schema `security`) | `infinito-security/src/main/resources/schema.sql` |

**BD única:** `controlneg_rmx_db` — schemas `public` (negocio) + `security` (usuarios/roles).

**Producto de prueba habitual:** CHOCOCONO · barcode `7702402054416` · id producto **656**.

---

## 2. Orden de lectura para IA

```text
1. POS-PLAN-MAESTRO.md                    ← este archivo (IA / implementación)
2. ONBOARDING-FINANZAS-ORIGENES-CIERRES.md ← estado real financiero/B8
3. guia-conceptos-pos-cajero.md           ← cajeros y dueños (lenguaje sencillo)
4. entradas-almacen.md                    ← YA IMPLEMENTADO (no romper)
5. ventas-trazabilidad-dian-plan.md       ← ventas, documentos, historial, tirillas
6. inventario-planificacion.md            ← kardex, saldo único, conteo
7. finanzas-egresos-resumen-planificacion.md ← diseño histórico finanzas
8. bolsillos-planificacion.md             ← diseño/roadmap orígenes y cierre
9. AI-ONBOARDING-basic.md (backend)       ← controladores y convenciones Java
```

**Regla de oro:** no reintroducir columnas experimentales (`producto.inventario`, `grupo_espejo.inventario`) ni tablas `arqueo_caja` duplicadas — usar extensiones acordadas en `corte_venta` / `ventas_tipo`.

---

## 3. Inventario de documentos MD (conteo)

| # | Archivo | Líneas ~ | Tipo | Estado |
|---|---------|----------|------|--------|
| **0** | **`POS-PLAN-MAESTRO.md`** | *(este)* | Índice + cronología + mapa repos | **Maestro** |
| 1 | `entradas-almacen.md` | 356 | Handoff **implementado** | Mantener; Fase 4 kardex lo extiende |
| 2 | `inventario-planificacion.md` | 223 | Planeación kardex | Aprobado |
| 3 | `ventas-trazabilidad-dian-plan.md` | 838 | Planeación ventas + documentos + UI historial | Aprobado |
| 4 | `finanzas-egresos-resumen-planificacion.md` | 669 | Planeación finanzas + backup + arqueo | Aprobado |
| 5 | **`guia-conceptos-pos-cajero.md`** | ~320 | **Guía usuarios** (cajero/dueño) | Aprobado |
| 6 | **`bolsillos-planificacion.md`** | ~400 | Cuentas/bolsillos, movimientos, traslados | Aprobado — sprints B1–B7 |
| | **Total documentación** | **~3.200** | | |

**Ubicación:** `infinito-ai-front/.cursor/rules/movimientos-almacen/`

**Scripts SQL existentes (implementados):**

- `pos-relational-data-service/.../database/entrada_inventario.sql`
- `pos-relational-data-service/.../database/historial_precio_producto.sql`

**Scripts SQL planificados (a crear al ejecutar):** ver §8 y `ventas-trazabilidad-dian-plan.md` §3.

---

## 4. Cronología de la sesión (chat)

Resumen de decisiones en orden conversacional:

| Fase chat | Tema | Resultado |
|-----------|------|-----------|
| 1 | Inventario experimental revertido | Solo planeación; estado real = `entradas-almacen.md` + `producto.existencia` |
| 2 | Inventario futuro | Kardex, saldo único, conteo `AJUSTE_CONTEO` → `inventario-planificacion.md` |
| 3 | Ventas / NC / restaurar ticket / tab R | → `ventas-trazabilidad-dian-plan.md` |
| 4 | Finanzas: ayuda gerencial, roles, backup | Renombres, disclaimers, `funcionalidad_pos` → `finanzas-egresos-resumen-planificacion.md` |
| 5 | Retención 5 años | Solo **archivos backup**; **BD ilimitada** (sin purge) |
| 6 | Arqueo | Nequi/transfer **incluidos**; extender `corte_venta` + `ventas_tipo` (**no** `arqueo_caja` nueva) |
| 7 | Labels sin DIAN en UI/tirillas | Comprobante POS, control interno — no FE/CUFE |
| 8 | Arqueo vs `POST /corte-venta` | Arqueo = cierre actual + egresos por medio + fondo opcional |
| 9 | Egresos pagados desde caja/Nequi/QR | `egreso.metodo_pago_id` + flags `metodo_pago` |
| 10 | Cierre arqueo → sesión | Recomendar finalizar sesión (no bloqueo) |
| 11 | ticket → recibo → historial | Patrón staging OK; arqueo lee `historial_recibo` |
| 12 | «DIAN Ready» mínimo | 7 bloqueos §12 ventas; matriz §12.1 |
| 13 | Historial UI | Filtros **Anulados** / **Restaurados** + panel NC/ND §7.5 |
| 14 | **Aprobación usuario** | Todo lo anterior + **pg_dump** + **backfill histórico** + MD maestro |
| 15 | **Guía cajero** | `guia-conceptos-pos-cajero.md` — conceptos en lenguaje sencillo |

---

## 5. Decisiones cerradas (consolidado)

### Producto y comunicación

- POS para **no responsable de IVA**; sin FE obligatoria.
- UI/tirillas: **comprobante de venta POS**, ayuda gerencial, control interno.
- **No** usar en producto: factura electrónica, CUFE, «válido ante DIAN», utilidad fiscal.

### Ventas y documentos

- Capa `documento_venta` + consecutivo `VTA-*` al pagar.
- Anular → **NC interna** (CREDITO) + documento ANULADO + reintegro stock.
- Restaurar ticket (pago erróneo) → NC + reintegro + ticket en edición; filtro **Restaurados**.
- Editar delta ↑ → ND; delta ↓ → NC.
- Reabrir pendiente → motivo; sin NC de valor si no hubo cierre definitivo.
- Tab ticket badge **«R»** si restaurado/reabierto/edición.
- **Backfill histórico aprobado:** script opcional `05_backfill_documento_venta.sql` para ventas pre-go-live.

### Inventario

- Un solo saldo: `producto.existencia`.
- Venta POS descuenta vía kardex `VENTA_POS`.
- Conteo físico ≤ 1 día → `AJUSTE_CONTEO` inmediato.
- Entradas almacén actuales se mantienen; migración a kardex en Fase 4.

### Finanzas

- Resumen = **resultado operativo** (ayuda gerencial); disclaimers obligatorios.
- Arqueo = **`corte_venta` + `ventas_tipo`** extendidos; todos los medios de pago.
- `total_sistema[medio]` = ventas − egresos (+ fondo efectivo opcional).
- `metodo_pago.visible_pagos_egresos`, `es_base_proveedores` para origen de pago en egresos.

### Seguridad y roles

- Roles actuales: `admin`, `cajero`, `invitado` en `security.roles`.
- Multi-rol permitido (admin + cajero tienda unipersonal).
- Plan: `funcionalidad_pos` + `funcionalidad_rol` en `public`; permisos efectivos = unión OR.
- Anular / restaurar / backup BD / egresos escritura → **admin** (fase roles).

### Backup

- **Capa A (aprobada):** `pg_dump` nativo PostgreSQL + tabla `backup_registro`.
- **Capa B (mantener):** Excel app `CopiasSeguridadController`.
- Retención archivos backup: recomendación 5 años configurable.
- Datos en BD: **ilimitados** (sin purge automático).

### Infra recomendada (no bloqueante)

- **NTP:** sincronizar reloj del servidor.
- **Manual operativo:** 1–2 páginas para el dueño (fase 2).

---

## 6. «DIAN Ready mínimo» — 7 bloqueos (aprobados)

| # | Bloqueo | Doc detalle | Repo principal |
|---|---------|-------------|----------------|
| 1 | `establecimiento` + API | ventas §3 Fase 0, §9 | backend + front admin |
| 2 | `documento_venta` hook PAGADO | ventas §3 Fase 1 | backend `ReciboServiceImpl` |
| 3 | Anular con NC + historial Anulados | ventas §4–§5, §7.5 | backend + `historial-ventas` |
| 4 | Kardex `VENTA_POS` | inventario + ventas Fase 2 | backend |
| 5 | Tirilla completa | ventas §9, finanzas §3.5 | `recibo-print.service.ts` |
| 6 | Egreso medio pago + corte | finanzas §6.3 | backend + `egreso-edit`, `cierre-ventas` |
| 7 | Bitácora ventas/egresos | ventas Fase 3, finanzas §7 | backend `BitacoraUsuarioService` |

Matriz ampliada: `ventas-trazabilidad-dian-plan.md` §12.1–§12.6.

---

## 7. Plan de ejecución por sprints (para IA)

### Sprint 0 — Preparación BD catálogos

**Backend:** scripts en `pos-relational-data-service/src/main/resources/doc/contextos/database/`

| Orden | Script | Contenido |
|-------|--------|-----------|
| 0 | `00_establecimiento.sql` | Tabla + seed régimen NO RIVA |
| 1 | `01_consecutivo_documento.sql` | VENTA, NC, ND, MOV_INVENTARIO |
| 2 | `02_motivo_operacion.sql` | Catálogo motivos |
| 3 | `03_tipo_movimiento_inventario.sql` | VENTA_POS, REINTEGRO_VENTA, etc. |
| 4 | `04_alinear_estado_recibos.sql` | Ids/siglas PEN/PAG/ANU/ED |
| 5 | `05_documento_venta.sql` | Tablas documentales |
| 6 | `05_backfill_documento_venta.sql` | **Aprobado** — ventas históricas legacy |
| 7 | `06_funcionalidad_pos.sql` | Permisos pantalla (opcional mismo sprint o S4) |
| 8 | `07_egreso_metodo_pago.sql` | `egreso.metodo_pago_id`, flags `metodo_pago` |
| 9 | `08_corte_venta_extend.sql` | Columnas `corte_venta`, `ventas_tipo` |
| 10 | `10_movimiento_inventario.sql` | Kardex cabecera/detalle |
| 11 | `11_inventario_kardex.sql` | Libro auxiliar |
| 12 | `12_backup_registro.sql` | Metadatos backup |

**No ejecutar** scripts inventario experimental revertidos.

### Sprint 1 — Identidad + documento venta + tirilla (bloques 1, 2, 5)

| Repo | Tareas |
|------|--------|
| **Backend** | `EstablecimientoController`; hook `ReciboServiceImpl.update` PAGADO → `documento_venta`; DTO respuesta con consecutivo |
| **Front** | Admin/config establecimiento; `ReciboPrintService` cabecera dinámica; badges `VTA-*` en historial |
| **Security** | Sin cambios |

**Archivos clave front:**

- `src/app/pages/apps/ventas/service/recibo-print.service.ts`
- `src/app/pages/apps/ventas/historial-ventas/*`
- `src/app/pages/apps/ventas/detalle-ticket/*`, `pago-efectivo-cambio/*`

**Archivos clave backend:**

- `services/impl/ReciboServiceImpl.java`
- `controllers/ReciboController.java`
- Nuevo: `DocumentoVentaService`, `EstablecimientoController`

### Sprint 2 — NC anular + restaurar + historial (bloques 3, 4 parcial)

| Repo | Tareas |
|------|--------|
| **Backend** | `NotaAjusteService`; anular con NC; `POST .../restaurar-ticket`; kardex reintegro; `GET /historial-recibos/search` enriquecido |
| **Front** | Filtros Anulados/Restaurados; panel Documentos; botones Anular venta / Restaurar ticket; tab **R** |
| **Security** | `@PreAuthorize` anular/restaurar → admin (interino hasta funcionalidad_pos) |

**Archivos clave front:**

- `historial-ventas.component.html|ts`
- `tickets.component.*`
- `edicion-ticket.component.*`

### Sprint 3 — Kardex venta + entrada almacén puente (bloque 4 completo)

| Repo | Tareas |
|------|--------|
| **Backend** | Hook PAGADO → `VENTA_POS`; confirmar `entrada_inventario` → `COMPRA_EGRESO` kardex |
| **Front** | Sin cambio mayor UI inventario |
| **Security** | — |

Ver `inventario-planificacion.md` §4–§5; no romper `entradas-almacen.md`.

### Sprint 4 — Finanzas + arqueo + roles (bloques 6, 7, G, H)

| Repo | Tareas |
|------|--------|
| **Backend** | `CorteVentaServiceImpl.consultarRango` resta egresos; `Egreso` validación medio; bitácora eventos; `funcionalidad_pos` seeds |
| **Front** | `egreso-edit` origen pago; `cierre-ventas` labels; `resumen-economico` renombres §3 finanzas |
| **Security** | Seeds `funcionalidad_rol`; front guards; multi-rol UI gestión usuarios |

### Sprint 5 — Backup pg_dump (aprobado)

| Repo | Tareas |
|------|--------|
| **Backend** | Servicio ejecuta `pg_dump` (ProcessBuilder); `BackupRegistroController`; cron opcional |
| **Front** | Admin → Backup BD (separado de Excel) |
| **Security** | Solo `admin` |

Detalle: `finanzas-egresos-resumen-planificacion.md` §5.6.

### Sprints B1–B8 — Bolsillos / cuentas internas

| Sprint | Tareas |
|--------|--------|
| **B1** | SQL `12`–`15`; entidades; GET cuentas y motivos; `manejo_estricto_cuentas` |
| **B2** | API movimientos (entrada, préstamo, traslado, ajuste); validación estricta |
| **B3** | UI `/apps/financiero/bolsillos`; CRUD motivos |
| **B4** | `egreso.cuenta_bolsillo_id` + `SALIDA_EGRESO` automático |
| **B5** | Cierre + `AJUSTE_CIERRE` con motivo |
| **B6** | KPI % surtir → Datos del negocio (**aplazado**) |
| **B7** | Export CSV contador (**aplazado**) |
| **B8** | Workflow cierre: detalle snapshot, estados, revisión admin y soft-delete |

Detalle: `bolsillos-planificacion.md`.

---

## 8. Mapa cambio → repositorio → archivos

### Backend (`pos-relational-data-service`)

| Dominio | Clases / rutas actuales | Cambio planificado |
|---------|-------------------------|-------------------|
| Ventas pagar | `ReciboServiceImpl.update` | + documento_venta + kardex |
| Historial | `HistorialReciboServiceImpl` | + anular NC, restaurar, search enriquecido |
| Corte | `CorteVentaServiceImpl` | + egresos en consultarRango; columnas extendidas |
| Egresos | `EgresoServiceImpl` | + metodo_pago_id |
| Inventario entrada | `EntradaInventarioServiceImpl` | + puente kardex (Fase 4) |
| Estadísticas | `EstadisticaFinancieraService` | Excluir anuladas con NC (post Sprint 2) |
| Backup | `BackupService`, `CopiasSeguridadController` | + PgDumpBackupService |
| Bitácora | `BitacoraUsuarioService` | Eventos venta/egreso/NC |
| Seguridad POS | `security/*`, `@PreAuthorize` | Alinear permisos |

### Frontend (`infinito-ai-front`)

| Ruta app | Componente | Cambio |
|----------|------------|--------|
| `/apps/tickets` | `tickets`, `detalle-ticket` | Tab R; consecutivo al pagar |
| `/apps/tickets/historial` | `historial-ventas` | Filtros; panel NC/ND; restaurar |
| `/apps/tickets/.../edicion` | `edicion-ticket` | Reabrir pendiente |
| `/apps/financiero/egresos` | `egreso-edit` | Origen de pago |
| `/apps/financiero/ingresos` | `cierre-ventas` | Arqueo multi-medio |
| `/apps/financiero/resumen-economico` | renombres §3 | Ayuda gerencial |
| `/apps/financiero` | `financiero.component` | Badges navegación |
| Admin backup | *(nuevo)* | pg_dump UI |
| Impresión | `recibo-print.service.ts` | Establecimiento + VTA |

### Seguridad (`infinito-security`)

| Artefacto | Cambio |
|-----------|--------|
| `schema.sql` / `data.sql` | Roles existentes; opcional rol `contador` fase 2 |
| `usuario_roles` | Multi-rol documentado |
| API roles | Sin cambio estructural; front sigue `PUT /auth/actualizar-roles-usuarios` |
| Permisos finos | Catálogo en BD `public.funcionalidad_pos` (POS valida con JWT roles) |

---

## 9. Endpoints nuevos / modificados (referencia rápida)

| Método | Ruta | Sprint |
|--------|------|--------|
| GET | `/establecimiento/actual` | 1 |
| PUT | `/recibos/{id}` PAGADO | 1 (+ documento + kardex S3) |
| PUT | `/historial-recibos/{id}` anular | 2 (+ NC) |
| POST | `/historial-recibos/{id}/restaurar-ticket` | 2 |
| POST | `/recibos/{id}/reabrir-pendiente` | 2 |
| GET | `/historial-recibos/search?estado=` | 2 |
| GET | `/historial-recibos/{id}/documentos` | 2 |
| GET | `/api/funcionalidades/mis-permisos` | 4 |
| POST | `/api/backup/pg-dump` | 5 |

Lista completa: `ventas-trazabilidad-dian-plan.md` §8.

---

## 10. Checklist maestro de implementación

Marcar al ejecutar (consolidado de todos los MD hijos):

### BD

- [ ] Fase 0 catálogos (establecimiento, consecutivos, motivos, tipos movimiento)
- [ ] Fase 1 documento_venta + nota_ajuste
- [ ] **Backfill histórico aprobado** (`05_backfill_documento_venta.sql`)
- [ ] Fase 2 kardex
- [ ] Extensión corte_venta / ventas_tipo / egreso / metodo_pago
- [ ] backup_registro
- [ ] funcionalidad_pos + funcionalidad_rol

### Backend

- [ ] Hook PAGADO → documento + kardex
- [ ] Anular / restaurar con NC + motivo
- [ ] consultarRango − egresos
- [ ] Bitácora ventas/egresos/NC
- [ ] pg_dump + registro

### Frontend

- [ ] Tirilla establecimiento + VTA
- [ ] Historial Anulados / Restaurados + panel documentos
- [ ] Restaurar ticket + tab R
- [ ] egreso origen pago + cierre arqueo
- [ ] Resumen ayuda gerencial labels
- [ ] Admin backup BD

### Seguridad

- [ ] Permisos anular/restaurar/backup → admin
- [ ] mis-permisos + guards (Sprint 4)

### Pruebas mínimas

- [ ] Pagar CHOCOCONO → VTA + kardex − existencia
- [ ] Anular → NC visible filtro Anulados
- [ ] Restaurar → NC + filtro Restaurados + tab R
- [ ] Corte con egreso Nequi descontado
- [ ] pg_dump restaurable en entorno prueba
- [ ] Entrada almacén sigue OK (`entradas-almacen.md` §9)

---

## 11. Lo que NO hacer

1. Crear tablas `arqueo_caja` paralelas a `corte_venta`.
2. Duplicar saldo (`producto.inventario` + `existencia`).
3. Poner textos FE/DIAN/CUFE en tirillas o banners operativos.
4. Purge automático de `historial_recibo` / kardex por antigüedad.
5. Implementar facturación electrónica en este alcance.
6. Romper flujo `entrada_inventario` confirmado en producción sin puente kardex probado.

---

## 12. Índice de secciones en documentos hijos

| Documento | Secciones clave |
|-----------|-----------------|
| `guia-conceptos-pos-cajero.md` | §7 kardex, §4–§6 NC/ND, §8 arqueo, §10 escenarios |
| `entradas-almacen.md` | §5 botón visible, §9 checklist retomar |
| `inventario-planificacion.md` | §5 decisiones, §6 diagrama, movimientos kardex |
| `ventas-trazabilidad-dian-plan.md` | §3 BD fases, §5 restaurar, §7.5 historial, §9 tirilla, §12 DIAN Ready, §12.7 glosario |
| `finanzas-egresos-resumen-planificacion.md` | §3 labels, §4 roles, §5 backup/pg_dump, §6 arqueo, §9 checklist |

---

## 13. Handoff one-liner para IA

```text
POS no RIVA aprobado: implementar Sprint 0→5 en orden; leer POS-PLAN-MAESTRO.md;
ventas documento_venta+NC+historial Restaurados/Anulados; inventario kardex;
finanzas arqueo extend corte_venta+egreso metodo_pago; backup pg_dump+backfill;
labels ayuda gerencial sin DIAN; repos: pos-relational-data-service :8088,
infinito-ai-front Angular 17, infinito-security schema security.
```

---

*Documento maestro generado al cierre de la sesión de planeación — usuario aprobó todas las recomendaciones incl. pg_dump y backfill histórico (2026-06-06).*
