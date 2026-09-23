// Resolución del origen del backend según cómo se sirvió la app:
//  - Dev server de Angular (`:4200`, local o por IP de LAN): habla directo con los
//    backends por puerto -> http://<host>:8081 y :8088.
//  - Cualquier otro origen (Caddy en :8080, o el túnel HTTPS de Cloudflare en :443):
//    se asume un reverse proxy de un solo origen -> rutas RELATIVAS ('' => /auth, /products),
//    lo que evita CORS y mixed-content.
const loc = typeof window !== 'undefined' ? window.location : undefined;
const apiHost = loc?.hostname || 'localhost';
const isDevServer = loc?.port === '4200';

export const environment = {
  production: true,
  builderApiKey: '06e0922284dc424bb6ca15d07296678f',
  apiHost,
  apiUrlRelationalDb: isDevServer ? `http://${apiHost}:8088` : '',
  apiUrlAuth: isDevServer ? `http://${apiHost}:8081` : '',
  apiUrlPuenteTienda: isDevServer ? `http://${apiHost}:8095` : '',
  localStorageKeyEstadosRecibos: 'estados_recibos',
  /** Si true, no envía errores a POST /reporte-frontend. */
  reporteFrontendDeshabilitado: false
};
