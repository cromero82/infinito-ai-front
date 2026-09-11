// Tienda Infinito v02 — Angular :4220 / Caddy :8280 / túnel tienda-infinito.mayaksoluciones.com
// Paralelo a la caja productiva (:4200 / :8088). BD: controlneg_rmx_db_v02.
const loc = typeof window !== 'undefined' ? window.location : undefined;
const apiHost = loc?.hostname || 'localhost';
const isTiendaDevServer = loc?.port === '4220';

export const environment = {
  production: false,
  sandbox: false,
  builderApiKey: '06e0922284dc424bb6ca15d07296678f',
  apiHost,
  apiUrlRelationalDb: isTiendaDevServer ? `http://${apiHost}:8288` : '',
  apiUrlAuth: isTiendaDevServer ? `http://${apiHost}:8281` : '',
  apiUrlPuenteTienda: isTiendaDevServer ? `http://${apiHost}:8295` : '',
  localStorageKeyEstadosRecibos: 'estados_recibos_v02',
  reporteFrontendDeshabilitado: false
};
