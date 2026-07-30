# Onboarding IA — Finanzas, egresos, orígenes de fondos y cierres

**Fecha de corte:** 2026-07-18  
**Propósito:** permitir que otra IA (o un chat nuevo) retome el trabajo sin reconstruir la
conversación completa.  
**Estado:** documento de handoff técnico; describe el código y la BD reales, no solo el diseño.

> Leer este archivo antes de modificar Egresos, Orígenes de fondos, movimientos o Cierre de turno.
> Después consultar [`bolsillos-planificacion.md`](./bolsillos-planificacion.md) para el diseño futuro.

---

## 1. Alcance de este handoff

Incluye todo el trabajo acumulado sobre:

1. Extensiones iniciales de finanzas (`metodo_pago`, egresos y arqueo).
2. Evolución “Bolsillos” → **Orígenes de fondos**.
3. Ledger `movimiento_origen_fondos`.
4. Egreso vinculado a un origen y movimiento automático.
5. Jerarquía de orígenes.
6. Modo estricto/flexible.
7. Cierre B5: desfase, motivo y `AJUSTE_CIERRE`.
8. Cierre B8: detalle, estados, revisión admin y soft-delete.
9. Roles actuales y diseño pendiente de permisos por registro MPOF.
10. Incidentes conocidos, especialmente el botón **Registrar cierre**.

No cubre en profundidad inventario, documentos de venta/DIAN, notas crédito ni restauración de
ticket, salvo cuando impactan el ledger futuro.

---

## 2. Repositorios, runtime y tecnología

| Proyecto | Ruta | Rol | Runtime |
|----------|------|-----|---------|
| Frontend | `/home/carlosr/Documentos/dev/repos/infinito-ai-front` | Angular POS | `:4200` |
| Backend negocio | `/home/carlosr/Documentos/dev/repos/pos-relational-data-service` | Spring Boot/JPA | `:8088` |
| Seguridad | `/home/carlosr/Documentos/dev/repos/infinito-security` | Login/JWT/usuarios | `:8081` |
| PostgreSQL | `controlneg_rmx_db`, schema `public` | Datos negocio | `:5432` |

Versiones observadas:

- Front: package histórico `vex 17.0.0`, pero dependencias reales Angular **21.2.x**.
- Backend: Java 11, Spring Boot 2.7.18, Hibernate/JPA.
- `spring.jpa.hibernate.ddl-auto=none`: **las migraciones SQL son obligatorias**.

Servicios activos en la captura de este documento:

- Angular `:4200`
- auth `:8081`
- backend negocio `:8088`

No asumir que continúan activos en otro chat: comprobar puertos antes de iniciar procesos.

### Git / cambios locales

Hay una cantidad grande de cambios staged, unstaged y untracked en ambos proyectos. En varias
ejecuciones la detección del repositorio fue inconsistente. **No resetear, limpiar, descartar ni
sobrescribir archivos masivamente.** Antes de commit:

```bash
git status --short
git diff
git diff --cached
```

No crear commit ni push sin petición explícita.

---

## 3. Principios de dominio que no deben romperse

```text
metodo_pago
  = tender/canal usado para pagar un ticket
  = efectivo, Nequi, QR, transferencia

origen_fondos
  = cuenta/wallet lógica donde vive o se reserva dinero
  = caja operativa, reserva proveedores, nómina, arriendo

caja (pendiente)
  = puesto físico/till asociado a sesión

movimiento_origen_fondos
  = ledger auditable que cambia el saldo de un origen
```

Decisión cerrada: **no fusionar** `metodo_pago` y `origen_fondos` en una tabla polimórfica MPOF.

“MPOF” es una notación de producto/UI: Método de Pago u Origen de Fondos. Internamente:

- tickets siguen usando `metodo_pago`;
- saldo, egresos y traslados deben usar `origen_fondos`;
- una raíz operativa puede enlazar `origen_fondos.metodo_pago_id`;
- los hijos usan `parent_origen_fondos_id`;
- caja/turno/sesión se modelarán aparte.

Saldo de un origen:

```sql
SUM(movimiento_origen_fondos.impacto)
```

Nunca editar un saldo directo. Corregir mediante movimientos compensatorios.

---

## 4. Evolución de nombres (muy importante)

| Nombre histórico | Nombre vigente |
|------------------|----------------|
| `tipo_bolsillo` | `tipo_origen_fondos` |
| `cuenta_bolsillo` | `origen_fondos` |
| `movimiento_bolsillo` | `movimiento_origen_fondos` |
| `egreso.cuenta_bolsillo_id` | `egreso.origen_fondos_id` |
| `/cuentas-bolsillo` | `/origenes-fondos` |
| `/movimientos-bolsillo` | `/movimientos-origen-fondos` |
| `/apps/financiero/bolsillos` | `/apps/financiero/origenes-fondos` |

Los archivos SQL 13–17 conservan nombres históricos porque preceden al rename 18. El código Java
y Angular nuevo debe usar siempre **OrigenFondos**.

---

## 5. Migraciones de BD y orden

Directorio:

`pos-relational-data-service/src/main/resources/doc/contextos/database/`

### Base financiera

| SQL | Efecto |
|-----|--------|
| `07_egreso_metodo_pago.sql` | `egreso.metodo_pago_id`, flags de medios para egresos |
| `08_corte_venta_extend.sql` | ventas/egresos/desfase en `ventas_tipo`; campos iniciales de corte |
| `09_metodo_pago_extend.sql` | descripciones/visibilidad y medio “base proveedores” |

### Orígenes y ledger

| SQL | Efecto |
|-----|--------|
| `12_establecimiento_manejo_cuentas.sql` | modo estricto/flexible |
| `13_bolsillos_catalogos.sql` | tipos y motivos |
| `14_cuenta_bolsillo.sql` | cuentas iniciales/backfill por medio |
| `15_movimiento_bolsillo.sql` | ledger |
| `16_egreso_cuenta_bolsillo.sql` | vínculo egreso→cuenta |
| `17_cuenta_bolsillo_parent.sql` | jerarquía |
| `18_rename_origen_fondos.sql` | rename físico completo |

### Cierre

| SQL | Efecto |
|-----|--------|
| `19_cierre_motivo_desfase.sql` | `motivo_desfase_id` + motivos `DESFASE_CIERRE` |
| `20_corte_venta_workflow.sql` | estado/observación/revisión + `corte_venta_detalle` + backfill |

Scripts:

```bash
./apply-sprint4.sh
./apply-bolsillos-p1.sh
./apply-bolsillos-p2.sh
./apply-bolsillos-p3.sh
./apply-origen-fondos-rename.sh
./apply-bolsillos-b5.sh
./apply-bolsillos-b8.sh
```

Advertencias:

- `apply-all-sprints.sh` no garantiza aplicar B1–B8.
- No hay Flyway/Liquibase.
- El rename 18 no es seguro para repetir indiscriminadamente.
- Los scripts contienen una URL de BD con credencial por defecto: no copiarla a documentación,
  logs ni respuestas. Debe migrarse a variables de entorno.
- Antes de aplicar SQL, tomar backup y consultar columnas/tablas actuales.

### Foto de BD al 2026-07-18 14:19 (UTC-5)

```text
corte_venta: revisada = 67
corte_venta_detalle = 152
origen_fondos = 7
movimiento_origen_fondos = 2
```

Estos conteos son diagnósticos temporales, no invariantes.

---

## 6. Modelo implementado

### 6.1 `origen_fondos`

Entidad:

`pos-relational-data-service/.../entities/OrigenFondos.java`

Campos relevantes:

- `tipo_origen_fondos_id`
- `proveedor_id`
- `metodo_pago_id`
- `parent_origen_fondos_id`
- `naturaleza`
- `visible_en_egreso`
- `requiere_conciliacion`
- `activo`, `orden`, `color`, `notas`

Jerarquía: adjacency list padre→hijos. Hoy no existe protección fuerte contra ciclos.

### 6.2 `movimiento_origen_fondos`

Archivos:

- `entities/MovimientoOrigenFondos.java`
- `entities/enums/TipoMovimientoOrigenFondos.java`
- `repositories/MovimientoOrigenFondosRepository.java`
- `services/impl/MovimientoOrigenFondosServiceImpl.java`

Tipos implementados:

- `ENTRADA_MANUAL`
- `ENTRADA_PRESTAMO`
- `TRASLADO`
- `SALIDA_EGRESO`
- `SALIDA_DEVOLUCION_PRESTAMO`
- `AJUSTE_SALDO`
- `AJUSTE_CIERRE`
- `REVERSO_AJUSTE_CIERRE`

Campos clave:

- `valor`: magnitud positiva
- `impacto`: signo real sobre saldo
- `saldo_antes`, `saldo_despues`: snapshot
- `origen_fondos_id`, `origen_destino_id`
- `metodo_pago_id`
- `motivo_movimiento_id`
- `origen_tipo`, `origen_id`: referencia lógica al hecho (`EGRESO`, `CIERRE`, etc.)
- `grupo_traslado_id`: enlaza las dos patas del traslado

Pendiente:

- `idempotency_key`
- watermark `ultimo_movimiento_origen_fondos_id`
- vínculo directo `corte_venta_id`
- movimientos automáticos de ventas/anulaciones/devoluciones
- `BASE_TURNO` y `AJUSTE_ENCONTRADO_BASE`

### 6.3 `corte_venta` y `corte_venta_detalle`

Cabecera `corte_venta`:

- periodo, usuario, total, total sistema, último recibo;
- `estado`: `creada`, `revisada`, `eliminado`;
- `observacion VARCHAR(200)`;
- `revisado_por`, `fecha_revision`.

Detalle B8:

- método/origen;
- base, ventas, egresos, movimientos, neto;
- total físico/real y desfase;
- motivo;
- `modo_captura`: `DECLARADO_CAJERO`, `SOLO_VISIBLE`, `DECLARADO_ADMIN`;
- revisión: `PENDIENTE`, `OK`, `SUGERENCIA`;
- comentario, orden y flag de ajuste.

Actualmente Base y Movimientos se guardan como cero desde FE. La tabla está preparada, pero la
fórmula ledger completa aún no está conectada.

`ventas_tipo` continúa en dual-write por compatibilidad con dashboard/legacy.

---

## 7. Backend: endpoints y archivos clave

### Orígenes

Controller: `OrigenFondosController.java`

```text
GET /origenes-fondos
GET /origenes-fondos/para-egreso
GET /origenes-fondos/arbol
GET /origenes-fondos/arbol-egreso
GET /origenes-fondos/{id}
```

No existe CRUD completo de orígenes.

### Movimientos

Controller: `MovimientoOrigenFondosController.java`

```text
GET  /movimientos-origen-fondos?origenFondosId=...
POST /movimientos-origen-fondos/entrada-manual
POST /movimientos-origen-fondos/prestamo
POST /movimientos-origen-fondos/traslado
POST /movimientos-origen-fondos/ajuste
```

Las escrituras manuales son admin-only en backend.

### Egresos

Archivos principales:

- `entities/Egreso.java`
- `controllers/EgresoController.java`
- `services/impl/EgresoServiceImpl.java`
- `repositories/EgresoRepository.java`

Crear:

1. FE envía `origenFondosId`.
2. BE valida origen activo/visible.
3. Resuelve método asociado (subiendo por padres si es hijo).
4. Guarda egreso.
5. Genera `SALIDA_EGRESO` con impacto negativo.

Editar:

1. Compensa la salida anterior si cambian valor/origen/fecha.
2. Guarda cambio.
3. Crea nueva salida.

Eliminar:

1. Compensa movimientos.
2. Borra físicamente el egreso.
3. Conserva ledger.

Riesgo prioritario: la compensación de ediciones repetidas puede volver a compensar salidas
históricas y aumentar el saldo indebidamente. Agregar idempotencia/pruebas antes de extender.

### Cierre

Archivos:

- `controllers/CorteVentaController.java`
- `services/impl/CorteVentaServiceImpl.java`
- `entities/CorteVenta.java`
- `entities/CorteVentaDetalle.java`
- `dto/CorteVentaDTO.java`
- `dto/CorteVentaDetalleDTO.java`
- `dto/FinalizarRevisionCorteRequest.java`
- repositorios correspondientes.

Endpoints:

```text
POST   /corte-venta
GET    /corte-venta
GET    /corte-venta/{id}
GET    /corte-venta/search
GET    /corte-venta/consultar-rango
PUT    /corte-venta/{id}
PUT    /corte-venta/{id}/finalizar-revision   (admin)
DELETE /corte-venta/{id}                      (admin)
```

`consultar-rango` sigue siendo legacy:

```text
Ventas  = historial_recibo agrupado por metodo_pago
Egresos = egreso agrupado por metodo_pago
Neto    = Ventas − Egresos
```

Todavía no usa el ledger ni watermark. No incluye traslados/base/otros movimientos.

---

## 8. Frontend: rutas, servicios y componentes

Rutas:

```text
/apps/financiero/egresos
/apps/financiero/ingresos
/apps/financiero/origenes-fondos
```

### Egresos

- `.../egresos/egreso-edit/egreso-edit.component.*`
- `.../egresos/egreso-list/egreso-list.component.*`
- `.../egresos/service/egresos.service.ts`
- `.../egresos/util/metodo-pago-egreso-label.util.ts`

El selector carga `GET /origenes-fondos/arbol-egreso`, muestra jerarquía/saldo y envía
`origenFondosId`. El método de pago se conserva por compatibilidad.

### Orígenes

- `.../origenes-fondos/origenes-list/*`
- `.../origenes-fondos/origen-movimiento-dialog/*`
- `.../origenes-fondos/origen-ajuste-dialog/*`
- `.../origenes-fondos/service/*`

Implementado:

- tarjetas/saldos;
- árbol básico;
- historial;
- entrada manual;
- préstamo;
- traslado;
- ajuste;
- indicador estricto/flexible.

Pendiente:

- CRUD origen/tipo/motivo;
- matriz de permisos;
- filtros/paginación;
- jerarquía profunda robusta.

### Cierre y revisión

- `.../ingresos/cierre-ventas/cierre-ventas.component.*`
- `.../ingresos/cierre-revision/cierre-revision.component.*`
- `.../ingresos/ingresos.component.*`
- `.../ventas/service/corte-venta.service.ts`

Implementado:

- consulta del rango;
- ventas, egresos, neto, total real y desfase;
- motivo obligatorio si desfase ≠ 0;
- observación;
- snapshot B8;
- filtros Vigentes/Creados/Revisados/Eliminados/Todos;
- revisión admin OK/Sugerencia;
- finalizar revisión;
- soft-delete del último.

---

## 9. Workflow de cierre B5/B8

### Registro por cajero

```text
Consultar rango
→ editar total real por fila
→ motivo obligatorio si hay desfase
→ observación opcional
→ POST /corte-venta
→ estado creada
→ detalles PENDIENTE
→ AJUSTE_CIERRE en filas declaradas con desfase
```

### Registro por admin

```text
POST /corte-venta
→ estado revisada
→ revisado_por/fecha_revision
→ detalles DECLARADO_ADMIN + OK
```

### Revisión

- Admin abre corte `creada`.
- En `DECLARADO_CAJERO`: no cambia montos; solo OK/Sugerencia.
- En `SOLO_VISIBLE`: puede completar real/motivo y revisar.
- Todas las filas requieren OK o Sugerencia con texto.
- Finalizar cambia a `revisada`.

### Eliminación

- Solo último corte no eliminado.
- No se borra físicamente.
- Estado pasa a `eliminado`.
- Se generan `REVERSO_AJUSTE_CIERRE`.
- El cálculo de “último corte” ignora eliminados.

---

## 10. Incidente activo: botón «Registrar cierre»

Historia:

1. El botón quedó bloqueado incluso sin desfase.
2. Se corrigieron strings formateados, IDs de motivos y stale change detection.
3. Se reemplazó evaluación desde template por flag explícito `puedeRegistrar`.
4. El HAR del 2026-07-18 mostró la causa concreta restante:

```json
{
  "metodoPagoId": 4,
  "totalVentasSistema": 0,
  "totalEgresosSistema": 5000,
  "totalSistema": -5000
}
```

El formulario iniciaba el total real en `-5000`, pero `Validators.min(0)` y la validación
`totalReal < 0` bloqueaban el botón aunque el desfase fuera cero.

Último hotfix aplicado:

- eliminar `Validators.min(0)` de cierre;
- permitir neto/real negativo;
- preservar signo en `parseCurrency`;
- aceptar `-` en teclado;
- flag `puedeRegistrar` actualizado por handlers/finalize;
- mensaje visible con razón del bloqueo.

Estado de confirmación:

- **El código está aplicado.**
- La BD pasó de 66/148 a 67 cierres revisados/152 detalles, lo que sugiere que se registró un
  cierre posterior, pero el usuario no confirmó explícitamente que el botón quedó resuelto.
- Al retomar, verificar primero en UI antes de modificar nuevamente.

HAR de referencia:

- rango: `2026-07-10T19:57:15` → `2026-07-16T08:50:39`;
- neto total: `355000`;
- método 4: neto `-5000`;
- motivos `DESFASE_CIERRE` cargaron correctamente.

Diagnóstico recomendado:

1. Abrir modal y leer el hint naranja encima de acciones.
2. Confirmar en DevTools:
   - `datosConsultados === true`
   - `consultando === false`
   - `puedeRegistrar === true`
   - todas las filas tienen real numérico
3. Si sigue bloqueado, no aplicar otro hotfix a ciegas: inspeccionar el DOM/properties y capturar
   el texto exacto del hint.
4. Recordar que `ng serve` puede mostrar warnings de una versión anterior hasta recompilar.

Warning NG8102 de egreso:

```html
<!-- vigente -->
[class.opcion-hijo]="op.nivel > 0"
```

Si aparece aún `(op.nivel ?? 0)`, es salida/cache de compilación anterior; el archivo en disco ya
está corregido.

---

## 11. Roles y permisos: implementado vs pendiente

### Implementado

- JWT contiene roles `admin`, `cajero`, `invitado`.
- FE tiene `AuthService.isAdmin()` para UX.
- BE protege finalizar revisión y eliminar cierre como admin.
- Movimientos manuales de origen son admin-only.
- Admin que crea cierre lo deja revisado/OK.

### Pendiente crítico

No existe todavía `usuario_origen_fondos_permiso`.

Por tanto:

- cajero aún no recibe filtro real de orígenes por registro;
- el cierre FE envía todas las filas como `DECLARADO_CAJERO`;
- `SOLO_VISIBLE` existe en modelo/API, pero no se calcula desde permisos reales;
- no existe UI admin para asignar MPOF a cajeros;
- no hay caja/turno/exclusividad.

Diseño acordado:

```text
modo estricto:
  permisos usuario×origen
  cajero edita MPOF permitidos
  ve en solo lectura contrapartes que afectaron sus MPOF
  admin completa SOLO_VISIBLE

modo flexible:
  sin matriz restrictiva
```

No afirmar que “permisos por registro están implementados”. Solo está preparado el contrato B8.

Seguridad pendiente:

- cerrar autorizaciones de CorteVenta a nivel de clase;
- revisar mutaciones de Egreso (hoy roles demasiado amplios);
- no confiar en `localStorage`;
- agregar guards/tabs por permiso;
- sacar credenciales y API keys del repositorio.

---

## 12. Diferencia entre cierre y base siguiente

```text
AJUSTE_CIERRE
  corrige ledger del cierre actual:
  impacto = totalReal − totalSistema

BASE_TURNO
  establece fondo inicial del siguiente turno
```

No son la misma operación.

Base de siguiente turno sigue pendiente:

- modal al cerrar o al siguiente login;
- cancelar → logout;
- admin preferente;
- cajero cuenta efectivo si admin no lo hizo;
- bloqueo si caja ocupada en modo estricto;
- reintentar;
- diferencia admin/cajero → `AJUSTE_ENCONTRADO_BASE`.

Depende de implementar `caja`, `tipo_turno` y sesión.

---

## 13. Fórmula objetivo MPOF (no implementada completa)

```text
Neto sistema =
  Base inicial
  + Ventas
  − Egresos
  + SUM(impacto de otros movimientos)

Desfase = Total físico/Real − Neto sistema
```

En traslado:

- resta del origen;
- suma al destino.

Hoy el cierre sólo usa ventas − egresos por método. Base y Movimientos están en cero.

---

## 14. Riesgos técnicos prioritarios

1. **Egreso editado varias veces:** posible compensación múltiple.
2. **Sistema del cierre controlado por cliente:** BE recalcula rango, pero el snapshot B8 puede
   volver a tomar valores enviados por FE; recalcular siempre en servidor.
3. **Sin idempotencia:** doble submit puede duplicar cierres/movimientos.
4. **Reversos concurrentes:** consulta previa sin unique constraint.
5. **Modo estricto y ajustes negativos:** revisar que arqueo real<sistema no falle por saldo.
6. **Dual-write:** `ventas_tipo` y `corte_venta_detalle` pueden divergir.
7. **Jerarquía:** sin prevención de ciclos.
8. **Seguridad:** endpoints/UX no alineados todavía con matriz funcional.
9. **Migraciones manuales:** sin versionado formal/transacciones integrales.
10. **Secretos versionados:** datasource/API keys/scripts.

---

## 15. Pruebas y verificación

Ejecutado durante esta sesión:

```bash
# Backend
mvn test -q

# Frontend
npm install
npm run build
```

Resultados registrados:

- Backend compiló y tests pasaron.
- Frontend production build pasó.
- Se agregaron tres tests de soft-delete de corte:
  - elimina último;
  - rechaza uno anterior;
  - delete repetido es idempotente.

Falta cobertura:

- create cierre cajero/admin con contexto JWT;
- finalizar revisión;
- `SOLO_VISIBLE`;
- generación/reverso real de ledger;
- egreso create/edit/delete repetido;
- estricto/flexible;
- permisos/endpoints;
- concurrencia/idempotencia.

Antes de cerrar una corrección:

```bash
mvn test -q
npm run build
```

No usar sólo “Compiled successfully” del watcher como prueba de flujo.

---

## 16. Qué está hecho, parcial y pendiente

### Hecho

- B1/B2: catálogos, orígenes, ledger y operaciones básicas.
- B4: egreso→origen + `SALIDA_EGRESO`.
- jerarquía y rename.
- B5: motivo + `AJUSTE_CIERRE`.
- B8 core: detalle, estados, observación, revisión y soft-delete.
- FE de orígenes y revisión administrativa.

### Parcial

- B3: UI de movimientos sí; CRUD de orígenes/motivos no.
- B8: `SOLO_VISIBLE` modelado, no derivado de permisos.
- opción B: ledger existe, cierre aún no lo usa.
- cierre MPOF: tabla preparada, Base/Movimientos en cero.

### Pendiente

- matriz usuario×MPOF;
- caja, turnos y sesiones;
- base del siguiente turno;
- movimientos automáticos de ventas y devoluciones;
- watermark de ledger;
- idempotencia/locking;
- “Ver detalles” de movimientos en cierre;
- B6 KPI surtir (aplazado);
- B7 export contador (aplazado);
- hardening de seguridad y secretos;
- suite de pruebas financiera.

---

## 17. Orden recomendado al retomar

### Si el objetivo es resolver bugs

1. Reproducir con HAR + mensaje de UI.
2. Identificar si falla FE, API o datos.
3. Verificar netos negativos y filas invisibles.
4. Añadir test que reproduzca el problema.
5. Cambiar lo mínimo.
6. Build/test y prueba manual.

### Si el objetivo es continuar funcionalidad

Orden recomendado:

1. Corregir idempotencia/compensación de egresos.
2. Recalcular snapshot de cierre completamente en backend.
3. Implementar `idempotency_key` + ledger de ventas.
4. Mover cierre a ledger + watermark.
5. Implementar matriz usuario×origen.
6. Implementar caja/turno/base siguiente.
7. Completar Base/Movimientos/Ver detalles.
8. Retomar B6/B7.

No construir permisos/base sobre el cálculo legacy sin reconocer esa deuda.

---

## 18. Archivos que una IA debe leer primero

### Documentación

1. Este archivo.
2. `bolsillos-planificacion.md` §§14–22.
3. `POS-PLAN-MAESTRO.md`.
4. Backend `database/README-SPRINTS.md`.

### Frontend

1. `cierre-ventas/cierre-ventas.component.ts|html`
2. `cierre-revision/cierre-revision.component.ts|html`
3. `ingresos.component.ts|html`
4. `ventas/service/corte-venta.service.ts`
5. `egresos/egreso-edit/egreso-edit.component.ts|html`
6. `egresos/service/egresos.service.ts`
7. `origenes-fondos/**`

### Backend

1. `CorteVentaServiceImpl.java`
2. `MovimientoOrigenFondosServiceImpl.java`
3. `EgresoServiceImpl.java`
4. entidades/repos de Corte, Detalle, Origen y Movimiento
5. controllers correspondientes
6. SQL 12–20

---

## 19. Reglas operativas para futuras IA

- No renombrar nuevamente `origen_fondos`.
- No fusionar medio/origen/caja.
- No editar saldos directamente.
- No borrar ledger; compensar.
- No reutilizar `motivo_desfase` como observación.
- No recalcular un cierre revisado desde datos actuales: leer snapshot.
- No permitir borrar un corte anterior al último vigente.
- No usar un cierre eliminado como watermark.
- No confiar en flags del frontend para autorización.
- No declarar implementada la matriz MPOF hasta que exista en BD/API/UI.
- No ejecutar migraciones destructivas sin backup.
- No incluir credenciales reales en nuevos documentos o respuestas.
- No commit/push salvo solicitud.

---

## 20. Estado de parada

Se hizo una pausa intencional para pasar a estabilización y resolución de problemas.

Último trabajo funcional:

- B8 implementado y migrado.
- botón Registrar cierre recibió un hotfix por neto negativo del método 4;
- warning Angular de `op.nivel ?? 0` corregido en disco.

Próxima sesión:

1. confirmar visualmente el botón con el rango del HAR;
2. si funciona, no tocar otra vez esa validación;
3. priorizar pruebas y riesgos del §14;
4. sólo después continuar permisos MPOF/ledger/caja.

