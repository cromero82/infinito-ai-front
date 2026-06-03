# Despliegue de la cotización de invitado — de `localhost:puerto` a Cloudflare Tunnel

> Historia de los cambios de conectividad (hosts/puertos) y guía de despliegue para
> continuar el desarrollo. Acompaña a
> `.cursor/rules/contexto-diseno/page-cotizacion-invitado.md` (diseño de la feature).

---

## 0. Topología de servicios

| Pieza | Puerto local | Tecnología |
|---|---|---|
| Frontend Angular (dev server) | `4200` | Angular 17 + Vex (`ng serve`) |
| MS Seguridad / Auth | `8081` | Java (Spring Boot) |
| MS Productos / relacional | `8088` | Java (Spring Boot) |
| Health server (gate de `npm start`) | `3001` | `node server.js` |
| Reverse proxy (para túnel) | `8080` | Caddy |

Todos corren en la **misma Mac** del establecimiento.

---

## 1. Punto de partida (problema)

Originalmente cada servicio tenía el host **hardcodeado** a `http://localhost:8081`
(auth) o `http://localhost:8088` (productos/relacional). Funcionaba solo abriendo la app
**en la propia Mac** (`localhost`).

Al abrir desde un **celular** (otra máquina), `localhost` apunta al **propio celular**, no a
la Mac → la sesión de invitado y la búsqueda de productos fallaban con
"No se pudo conectar al servidor".

---

## 2. Cambio 1 — Host dinámico (acceso por LAN)

Se centralizó el host del backend en `src/environments/environment.ts` y
`environment.prod.ts`, calculándolo desde `window.location` (el host por el que el navegador
abrió la app). Y se **reemplazaron todos** los `http://localhost:8081/8088` hardcodeados por
referencias a `environment`.

Servicios migrados a `environment.apiUrlRelationalDb` / `environment.apiUrlAuth`:
`auth.service` (8081), `configuration.service`, `products-service`, `domain-service`,
`product-info-strategy`, `cliente.service`, `tipos-service`, `egresos.service`,
`tipo-egreso.service`, `proveedor.service`, `estadistica-financiera.service`.
(Los demás servicios ya usaban `environment.apiUrlRelationalDb`, así que quedaron cubiertos
automáticamente.) No quedó ningún `http://localhost:8081/8088` hardcodeado.

Para servir por LAN: `ng serve --host 0.0.0.0`. Se verificó que:
- Los MS Java escuchan en `*:8081` / `*:8088` (todas las interfaces) → alcanzables por la IP LAN.
- El **firewall de aplicaciones de macOS estaba DESACTIVADO** (no hacía falta tocar `socketfilterfw`).
- El **CORS** del backend ya permite el origen `http://<ip-lan>:4200`.

Resultado: por LAN (p.ej. `192.168.1.6:4200`) funciona login-guest + búsqueda. **Pero** el
**escáner de cámara NO** funciona sobre `http://<ip>` (no es contexto seguro).

---

## 3. Cambio 2 — Cloudflare Tunnel (acceso por internet + HTTPS + cámara)

Los clientes están en **datos móviles** (no en la wifi del local) y la cámara exige **HTTPS**.
Solución: exponer por internet con HTTPS usando **Cloudflare Tunnel** (túnel rápido, sin cuenta).

### 3.1 Por qué hace falta un reverse proxy (Caddy)
El túnel rápido expone **un solo origen**. Desde HTTPS el navegador no puede llamar a
`http://...:8081`/`:8088` (mixed content + esos puertos no se exponen). Por eso se unifica todo
bajo **un solo origen** con Caddy, y el frontend usa **rutas relativas** (`/auth`, `/products`),
lo que además elimina CORS y mixed-content.

### 3.2 Frontend: rutas relativas detrás del proxy
`environment.ts` / `environment.prod.ts` ahora deciden según cómo se sirvió la app:

```ts
const loc = typeof window !== 'undefined' ? window.location : undefined;
const apiHost = loc?.hostname || 'localhost';
const isDevServer = loc?.port === '4200';

// Dev server (:4200, local o por IP LAN) -> puertos directos (no rompe al gestor).
// Cualquier otro origen (Caddy :8080 o túnel HTTPS :443) -> rutas relativas ('').
apiUrlRelationalDb: isDevServer ? `http://${apiHost}:8088` : '',
apiUrlAuth:         isDevServer ? `http://${apiHost}:8081` : '',
```

- Gestor por `localhost:4200` (o `ip:4200`) → sigue hablando por puertos directos (sin cambios).
- App por el túnel (puerto 443) → rutas relativas → las resuelve Caddy.

### 3.3 Caddy: un solo origen, solo endpoints de invitado
Archivo `Caddyfile` (raíz del repo), escucha en `:8080` (HTTP; el TLS lo termina el túnel).
**Por seguridad solo enruta lo que necesita el invitado**; el resto del API admin NO se
proxea (cae al handler de Angular y nunca llega a los MS):

```
:8080 {
    encode gzip

    @guestAuth { path /auth/*; method POST OPTIONS }
    handle @guestAuth { reverse_proxy 127.0.0.1:8081 }

    @catalogo {
        path /products /products/* /api/images/* /api/product-info/*
        method GET HEAD OPTIONS
    }
    handle @catalogo { reverse_proxy 127.0.0.1:8088 }

    handle {
        reverse_proxy 127.0.0.1:4200 { header_up Host localhost:4200 }
    }
}
```

`header_up Host localhost:4200` pasa el host-check de `ng serve`. El fallback SPA del dev
server devuelve `index.html` para navegaciones (requests con `Accept: text/html`).

### 3.4 cloudflared: túnel rápido (sin login)
```bash
cloudflared tunnel --url http://localhost:8080
```
Imprime una URL pública HTTPS aleatoria, p.ej. `https://<algo>.trycloudflare.com`.
La página del cliente: `https://<algo>.trycloudflare.com/apps/personas/micotizacion`.

> La URL **cambia** cada reinicio de `cloudflared` (es un túnel sin cuenta). Para URL fija,
> ver §5 (túnel con nombre).

---

## 4. Cómo levantar todo (orden) — modo desarrollo + túnel

Requiere `brew install cloudflared caddy` (ya instalados: cloudflared 2026.5.2, caddy 2.11.3).

```bash
# 0) Backends Java (8081, 8088) y, si se usa, health server (3001) deben estar arriba.

# 1) Frontend (dev server)
npx ng serve --host 127.0.0.1 --port 4200      # Caddy proxea a 127.0.0.1:4200

# 2) Reverse proxy (en la raíz del repo, donde está el Caddyfile)
caddy run --config Caddyfile                    # escucha en :8080

# 3) Túnel HTTPS público
cloudflared tunnel --url http://localhost:8080  # imprime la URL trycloudflare
```

Verificación rápida (sustituir `$U` por la URL del túnel):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Accept: text/html" "$U/apps/personas/micotizacion"  # 200
curl -s -X POST "$U/auth/login-guest"                                                              # token JWT
```

Procesos que deben permanecer vivos: backends Java + `ng serve` + `caddy` + `cloudflared`.
Si se apaga la Mac o cae el internet del local, el túnel cae.

---

## 5. Opciones de despliegue (para continuar)

### A) Cloudflare Tunnel con NOMBRE (URL fija) — recomendado para producción del túnel
Requiere **cuenta Cloudflare + dominio gestionado en Cloudflare**.
```bash
cloudflared tunnel login                       # abre navegador, autoriza el dominio
cloudflared tunnel create cotiza-infinito       # crea el túnel (credenciales en ~/.cloudflared)
# Config con ingress (hostname -> http://localhost:8080) y:
cloudflared tunnel route dns cotiza-infinito cotiza.tudominio.com
cloudflared tunnel run cotiza-infinito
```
Ventaja: URL estable `https://cotiza.tudominio.com`. Se puede correr como servicio
(`brew services` / `cloudflared service install`) para que arranque solo.

### B) Servir build estático en vez de `ng serve`
Para producción, `ng build` y que Caddy sirva `dist/` con `file_server` + fallback SPA
(`try_files {path} /index.html`). Más rápido, sin host-check ni websockets de HMR.
Recordar: con build estático, `environment.prod.ts` aplica (mismo patrón de rutas relativas).

### C) Catálogo en la nube + sync (mayor aislamiento, sobrevive a apagones del local)
Hospedar el Angular estático (Netlify/Vercel/Cloudflare Pages) y desplegar MS productos +
seguridad en un free tier (Oracle Always Free / Render / Fly.io) con una DB de catálogo.
El gestor **empuja** cambios de productos a la nube (one-way, baja frecuencia). Los clientes
nunca tocan la red del local. Más trabajo (sync + despliegue) pero más robusto/seguro.

### D) Wifi de invitados (descartada como principal)
Choca con que los clientes usan datos móviles y con el problema de HTTPS/cámara en LAN
(cert confiable para IPs locales en teléfonos ajenos no es viable). Solo válida si se renuncia
al escáner y se aísla bien una VLAN de invitados.

---

## 6. Seguridad — checklist

- [ ] Rol `invitado` **restringido a solo lectura** de productos en el MS de seguridad
      (no crear/editar/borrar, no acceso a finanzas/clientes/usuarios). Es la barrera real.
- [ ] El `Caddyfile` solo expone `/auth/*` (POST) y catálogo de lectura. No agregar
      `/api/mongoquery`, `/clients`, `/egresos`, etc. al proxy público.
- [ ] Considerar rate limiting / WAF (Cloudflare lo ofrece en túneles con nombre) ante abuso público.
- [ ] No exponer el POS de escritorio por el túnel (aunque el SPA cargue, sus llamadas admin
      no están proxeadas → fallan; aun así, idealmente bloquear esas rutas o servir un build
      separado solo-invitado para producción).

---

## 7. Estado verificado (última sesión)

- Por LAN (`ip:4200`): `login-guest` 200, `products` (con token) 200, preflight CORS 200.
- Por Caddy (`:8080`) y por el túnel HTTPS: `/apps/personas/micotizacion` 200,
  `login-guest` 200 (token), `products` con token 200.
- macOS app firewall: desactivado. Backends en `*:8081/8088`.
